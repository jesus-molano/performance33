import type { SignInMethods } from './types'

/** From the login providers of an account. A temporary password nobody remembers is not a way in: the last one can never be taken away. */
export function signInMethodsFrom(providers: readonly string[], hasOwnPassword: boolean): SignInMethods {
  const google = providers.includes('google')
  return { google, canDisconnectGoogle: google && hasOwnPassword && providers.length > 1 }
}
