import { isAuthError, isAuthRetryableFetchError, type SupabaseClient, type User } from '@supabase/supabase-js'
import { STORAGE_KEYS } from '@/config/app'
import { isEmailIdentifier } from '@/lib/accountRules'
import { removeStorage } from '@/lib/safeStorage'
import { invokeFunction } from './edgeFunctions'
import { authErrorMessage, isSamePasswordError, SamePasswordError } from './messages'
import { signInMethodsFrom } from './signInMethods'
import type { AuthEvent, AuthService, AuthUser } from './types'

interface ServerError {
  code?: string
  message?: string
}

interface SessionTokens {
  access_token: string
  refresh_token: string
}

function failIf(error: ServerError | null): void {
  if (error) throw new Error(authErrorMessage(error))
}

const toAuthUser = (user: User): AuthUser => ({ id: user.id, email: user.email ?? null })

export function createSupabaseAuth(client: SupabaseClient, createCheckClient: () => SupabaseClient): AuthService {
  const loadIdentities = async () => {
    const { data, error } = await client.auth.getUserIdentities()
    failIf(error)
    return data?.identities ?? []
  }
  // The gym computer is shared: always ask which account, or Google signs the last person back in.
  const googleOptions = () => ({ redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } })

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
        // Deferred: the client must not be called from inside its own callback (it would deadlock).
        if (next) setTimeout(() => listener(next), 0)
      })
      return () => data.subscription.unsubscribe()
    },

    async signIn(identifier, password) {
      if (isEmailIdentifier(identifier)) {
        const { error } = await client.auth.signInWithPassword({ email: identifier.trim(), password })
        failIf(error)
        return
      }
      const { session } = await invokeFunction<{ session: SessionTokens }>(client, 'login-username', { username: identifier, password })
      const { error } = await client.auth.setSession(session)
      failIf(error)
    },

    async signInWithGoogle() {
      const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: googleOptions() })
      failIf(error)
    },

    async changePassword(password) {
      const { error } = await client.auth.updateUser({ password })
      if (error && isSamePasswordError(error)) throw new SamePasswordError()
      failIf(error)
    },

    async verifyPassword(password) {
      const { data } = await client.auth.getSession()
      const email = data.session?.user.email
      if (!email) return false
      // A throwaway client: a sign-in on the main one would replace the session and wake every listener.
      const checker = createCheckClient()
      const { error } = await checker.auth.signInWithPassword({ email, password })
      if (error) {
        if (isAuthRetryableFetchError(error)) failIf(error)
        return false
      }
      await checker.auth.signOut({ scope: 'local' })
      return true
    },

    getSignInMethods: async (hasOwnPassword) => signInMethodsFrom((await loadIdentities()).map((identity) => identity.provider), hasOwnPassword),

    async connectGoogle() {
      const { error } = await client.auth.linkIdentity({ provider: 'google', options: googleOptions() })
      failIf(error)
    },

    async disconnectGoogle() {
      const identities = await loadIdentities()
      const google = identities.find((identity) => identity.provider === 'google')
      if (!google || identities.length < 2) return
      const { error } = await client.auth.unlinkIdentity(google)
      failIf(error)
    },

    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' })
      // Without connection the client keeps the session: on a shared computer it must go anyway.
      if (error) removeStorage(STORAGE_KEYS.cloudSession)
    },
  }
}
