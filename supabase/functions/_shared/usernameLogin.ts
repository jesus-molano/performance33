// What the login-username function does, over an injected backend (faked in the tests, real in login-username/index.ts).

import { isValidUsername, normalizeUsername } from './accounts.ts'
import { fail, ok, type HandlerResult } from './http.ts'

export interface SessionTokens {
  access_token: string
  refresh_token: string
}

export interface LoginBackend {
  /** Counts the attempt before anything else, atomically: false = over a limit. `client` is a hash of the caller's address. */
  reserveAttempt(username: string, client: string): Promise<boolean>
  /** The attempt never got to try the password. */
  releaseAttempt(username: string, client: string): Promise<void>
  clearFailures(username: string, client: string): Promise<void>
  /** The sign-in email of an active account, or null. It never leaves the function. */
  emailOf(username: string): Promise<string | null>
  /** The tokens, or null for wrong credentials. Throws on anything else (server down, rate limit). */
  signIn(email: string, password: string): Promise<SessionTokens | null>
}

/** Same answer for an unknown person and a wrong password; both count towards the limits, so it reveals nothing either. */
export async function handleUsernameLogin(body: unknown, client: string, backend: LoginBackend): Promise<HandlerResult> {
  const { username: rawUsername, password } = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  if (typeof rawUsername !== 'string' || typeof password !== 'string' || !password) return fail('invalid_credentials')
  const username = normalizeUsername(rawUsername)
  if (!isValidUsername(username)) return fail('invalid_credentials')
  if (!(await backend.reserveAttempt(username, client))) return fail('locked')
  let session: SessionTokens | null
  try {
    const email = await backend.emailOf(username)
    session = email ? await backend.signIn(email, password) : null
  } catch (error) {
    await backend.releaseAttempt(username, client).catch(() => undefined)
    throw error
  }
  if (!session) return fail('invalid_credentials')
  await backend.clearFailures(username, client)
  return ok({ session: { access_token: session.access_token, refresh_token: session.refresh_token } })
}
