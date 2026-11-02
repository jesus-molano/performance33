// Account error codes in words a coach understands (pure).

import type { AccountErrorCode } from './accountRules'

export const CONNECTION_MESSAGE = 'No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo.'

const NO_PERMISSION = 'No tienes permiso para hacer esto.'

const MESSAGES: Record<AccountErrorCode, string> = {
  invalid_input: 'Revisa los datos: hay alguno que no es válido.',
  unauthorized: NO_PERMISSION,
  forbidden: NO_PERMISSION,
  not_found: 'Esa persona ya no está en el equipo.',
  own_access: 'No puedes cambiar tu propio acceso.',
  last_admin: 'Tiene que quedar al menos un administrador.',
  username_taken: 'Ya hay alguien en el equipo con ese usuario.',
  email_taken: 'Ya hay alguien en el equipo con ese email.',
  name_taken: 'Ya hay alguien en el equipo con ese nombre.',
  invalid_credentials: 'Usuario o contraseña incorrectos.',
  locked: 'Demasiados intentos con este usuario. Espera 15 minutos y vuelve a probar.',
  failed: CONNECTION_MESSAGE,
}

export const accountErrorMessage = (code: AccountErrorCode): string => MESSAGES[code]

/** The code in an edge function's error body. Anything else counts as a connection problem. */
export function errorCodeFromBody(body: unknown): AccountErrorCode {
  const code = typeof body === 'object' && body !== null ? (body as { error?: unknown }).error : undefined
  return typeof code === 'string' && code in MESSAGES ? (code as AccountErrorCode) : 'failed'
}
