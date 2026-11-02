// Server errors in words a coach understands (pure).

import { accountErrorMessage, CONNECTION_MESSAGE } from '@/lib/accountMessages'

interface ServerError {
  code?: string
  message?: string
}

const SAME_PASSWORD_MESSAGE = 'Elige una contraseña distinta a la anterior.'

/** The new password is the one already in place: not an error while finishing a first login that half worked. */
export class SamePasswordError extends Error {
  constructor() {
    super(SAME_PASSWORD_MESSAGE)
  }
}

export const NOT_CHANGED_MESSAGE = 'Elige una contraseña distinta a la que te han dado.'
export const GOOGLE_FAILED_MESSAGE = 'No se ha podido continuar con Google. Inténtalo de nuevo.'
export const GOOGLE_NO_ACCOUNT_MESSAGE = 'Tu cuenta no tiene acceso. Esa cuenta de Google no está en el equipo del gimnasio: pídele al administrador que te cree una con ese email.'
export const GOOGLE_IN_USE_MESSAGE = 'Esa cuenta de Google ya está conectada a otra persona del equipo.'

const errorText = (error: ServerError): string => `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase()

export function isSamePasswordError(error: ServerError): boolean {
  const text = errorText(error)
  return text.includes('same_password') || text.includes('different from the old')
}

export function authErrorMessage(error: ServerError): string {
  const text = errorText(error)
  if (text.includes('invalid') && text.includes('credentials')) return accountErrorMessage('invalid_credentials')
  if (text.includes('user_banned') || text.includes('email_not_confirmed') || text.includes('email not confirmed')) return accountErrorMessage('invalid_credentials')
  if (isSamePasswordError(error)) return SAME_PASSWORD_MESSAGE
  if (text.includes('weak_password') || text.includes('password should')) return 'Esa contraseña es demasiado débil. Prueba con otra más larga.'
  if (text.includes('rate') && text.includes('limit')) return 'Demasiados intentos. Espera un rato y vuelve a probar.'
  return CONNECTION_MESSAGE
}

export function teamErrorMessage(error: ServerError): string {
  const message = error.message ?? ''
  if (error.code === '23505') return accountErrorMessage('name_taken')
  if (message.includes('password_not_changed')) return NOT_CHANGED_MESSAGE
  if (error.code === '42501') return accountErrorMessage('forbidden')
  return CONNECTION_MESSAGE
}

/** Error that Google or the login provider left in the address when coming back. */
export function readRedirectError(search: string, hash: string): string | null {
  const inSearch = new URLSearchParams(search)
  const inHash = new URLSearchParams(hash.replace(/^#/, ''))
  const found = [inSearch, inHash].find((params) => params.has('error') || params.has('error_code'))
  if (!found) return null
  const details = `${found.get('error_code') ?? ''} ${found.get('error_description') ?? ''}`.toLowerCase()
  if (details.includes('signup')) return GOOGLE_NO_ACCOUNT_MESSAGE
  if (details.includes('identity_already_exists') || details.includes('already linked')) return GOOGLE_IN_USE_MESSAGE
  return GOOGLE_FAILED_MESSAGE
}
