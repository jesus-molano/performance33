// What the login-username function does, over an injected backend (faked in the tests, real in login-username/index.ts).

import { isValidUsername, normalizeUsername } from './accounts.ts'
import { fail, ok, type HandlerResult } from './http.ts'

export interface SessionTokens {
  access_token: string
  refresh_token: string
}

export interface LoginBackend {
  isLocked(username: string): Promise<boolean>
  recordFailure(username: string): Promise<void>
  clearFailures(username: string): Promise<void>
  /** The sign-in email of an active account, or null. It never leaves the function. */
  emailOf(username: string): Promise<string | null>
  /** The tokens, or null for wrong credentials. Throws on anything else (server down, rate limit). */
  signIn(email: string, password: string): Promise<SessionTokens | null>
}

/** Same answer for an unknown person and a wrong password; both count towards the lockout, so it reveals nothing either. */
export async function handleUsernameLogin(body: unknown, backend: LoginBackend): Promise<HandlerResult> {
  const { username: rawUsername, password } = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  if (typeof rawUsername !== 'string' || typeof password !== 'string' || !password) return fail('invalid_credentials')
  const username = normalizeUsername(rawUsername)
  if (!isValidUsername(username)) return fail('invalid_credentials')
  if (await backend.isLocked(username)) return fail('locked')
  const email = await backend.emailOf(username)
  const session = email ? await backend.signIn(email, password) : null
  if (!session) {
    await backend.recordFailure(username)
    return fail('invalid_credentials')
  }
  await backend.clearFailures(username)
  return ok({ session: { access_token: session.access_token, refresh_token: session.refresh_token } })
}
