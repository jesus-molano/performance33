// Username + password sign-in, callable without a session. The email stays on the server.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { serveJson } from '../_shared/http.ts'
import { handleUsernameLogin, type LoginBackend } from '../_shared/usernameLogin.ts'
import { allowedOrigins, publicClient, serviceClient, serviceKey } from '../_runtime/env.ts'

/** Every answer takes at least this long, so timing does not tell an existing account from an unknown one. */
const MIN_RESPONSE_MS = 700
/** What the auth server answers for bad credentials, a blocked account or an unconfirmed one: all the same to the caller. */
const REFUSED_SIGN_IN = new Set(['invalid_credentials', 'user_banned', 'email_not_confirmed'])
/** Where a username can be: the team, then the members' app accounts. */
const LOGIN_TABLES = ['profiles', 'members'] as const

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Who is asking, as a salted hash: the address itself is never stored. The platform sets the first header; the last hop of the second is its own. */
async function clientKey(request: Request): Promise<string> {
  const address = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ?? 'unknown'
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${serviceKey()}:${address}`))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function createBackend(admin: SupabaseClient): LoginBackend {
  const call = async (fn: string, username: string, client: string) => {
    const { data, error } = await admin.rpc(fn, { p_username: username, p_client: client })
    if (error) throw error
    return data as unknown
  }
  return {
    reserveAttempt: async (username, client) => (await call('login_reserve_attempt', username, client)) === true,
    releaseAttempt: async (username, client) => void (await call('login_release_attempt', username, client)),
    clearFailures: async (username, client) => void (await call('login_clear_failures', username, client)),
    // Coaches and members' app accounts share the usernames (schema.sql keeps them apart): the same limits for both.
    async emailOf(username) {
      let userId: string | null = null
      for (const table of LOGIN_TABLES) {
        const { data, error } = await admin.from(table).select('user_id').eq('username', username).eq('active', true).maybeSingle()
        if (error) throw error
        userId = (data?.user_id as string | undefined) ?? null
        if (userId) break
      }
      if (!userId) return null
      const { data: found, error: userError } = await admin.auth.admin.getUserById(userId)
      if (userError) throw userError
      return found.user?.email ?? null
    },
    async signIn(email, password) {
      const { data, error } = await publicClient().auth.signInWithPassword({ email, password })
      if (data.session) return data.session
      if (error?.code && REFUSED_SIGN_IN.has(error.code)) return null
      throw error ?? new Error('sign-in failed')
    },
  }
}

Deno.serve((request) =>
  serveJson(request, allowedOrigins(), async (body) => {
    const [result] = await Promise.all([handleUsernameLogin(body, await clientKey(request), createBackend(serviceClient())), delay(MIN_RESPONSE_MS)])
    return result
  }),
)
