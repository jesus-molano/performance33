import type { SignInMethods } from './types'

/** From the login providers of an account. The last way in can never be taken away. */
export function signInMethodsFrom(providers: readonly string[]): SignInMethods {
  const google = providers.includes('google')
  return { google, canDisconnectGoogle: google && providers.length > 1 }
}
