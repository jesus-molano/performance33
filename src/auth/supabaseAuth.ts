import { isAuthError, isAuthRetryableFetchError, type SupabaseClient, type User } from '@supabase/supabase-js'
import { STORAGE_KEYS } from '@/config/app'
import { removeStorage } from '@/lib/safeStorage'
import { authErrorMessage } from './messages'
import type { AuthEvent, AuthService, AuthUser } from './types'

interface ServerError {
  code?: string
  message?: string
}

function failIf(error: ServerError | null): void {
  if (error) throw new Error(authErrorMessage(error))
}

const toAuthUser = (user: User): AuthUser => ({ id: user.id, email: user.email ?? null })

export function createSupabaseAuth(client: SupabaseClient): AuthService {
  return {
    isLocal: false,

    async getUser() {
      const { data, error } = await client.auth.getSession()
      // An expired token that cannot be refreshed offline comes back as "no session" plus this error.
      if (error && (isAuthRetryableFetchError(error) || !isAuthError(error))) throw error
      return data.session ? toAuthUser(data.session.user) : null
    },

    onChange(listener) {
      const { data } = client.auth.onAuthStateChange((event, session) => {
        let next: AuthEvent | null = null
        if (event === 'SIGNED_OUT') next = { type: 'signed-out' }
        else if (session && event === 'SIGNED_IN') next = { type: 'signed-in', user: toAuthUser(session.user) }
        else if (session && event === 'PASSWORD_RECOVERY') next = { type: 'recovery', user: toAuthUser(session.user) }
        // Deferred: the client must not be called from inside its own callback (it would deadlock).
        if (next) setTimeout(() => listener(next), 0)
      })
      return () => data.subscription.unsubscribe()
    },

    async signInWithPassword(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password })
      failIf(error)
    },

    async signInWithGoogle() {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        // The gym computer is shared: always ask which account, or Google signs the last person back in.
        options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
      })
      failIf(error)
    },

    async requestPasswordReset(email) {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
      failIf(error)
    },

    async updatePassword(password) {
      const { error } = await client.auth.updateUser({ password })
      failIf(error)
    },

    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' })
      // Without connection the client keeps the session: on a shared computer it must go anyway.
      if (error) removeStorage(STORAGE_KEYS.cloudSession)
    },
  }
}
