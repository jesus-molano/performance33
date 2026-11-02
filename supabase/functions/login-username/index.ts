// Username + password sign-in, callable without a session. The email stays on the server.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { serveJson } from '../_shared/http.ts'
import { handleUsernameLogin, type LoginBackend } from '../_shared/usernameLogin.ts'
import { allowedOrigins, publicClient, serviceClient } from '../_runtime/env.ts'

/** Every answer takes at least this long, so timing does not tell an existing account from an unknown one. */
const MIN_RESPONSE_MS = 700
/** What the auth server answers for bad credentials, a blocked account or an unconfirmed one: all the same to the caller. */
const REFUSED_SIGN_IN = new Set(['invalid_credentials', 'user_banned', 'email_not_confirmed'])

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function createBackend(admin: SupabaseClient): LoginBackend {
  const call = async (fn: string, username: string) => {
    const { data, error } = await admin.rpc(fn, { p_username: username })
    if (error) throw error
    return data as unknown
  }
  return {
    isLocked: async (username) => (await call('login_is_locked', username)) === true,
    recordFailure: async (username) => void (await call('login_record_failure', username)),
    clearFailures: async (username) => void (await call('login_clear_failures', username)),
    async emailOf(username) {
      const { data, error } = await admin.from('profiles').select('user_id').eq('username', username).eq('active', true).maybeSingle()
      if (error) throw error
      if (!data) return null
      const { data: found, error: userError } = await admin.auth.admin.getUserById(data.user_id as string)
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
    const [result] = await Promise.all([handleUsernameLogin(body, createBackend(serviceClient())), delay(MIN_RESPONSE_MS)])
    return result
  }),
)
