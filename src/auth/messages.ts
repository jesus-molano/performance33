// Server errors in words a coach understands (pure).

interface ServerError {
  code?: string
  message?: string
}

const CONNECTION = 'No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo.'

/** Most often the link was opened on another device: it only works in the browser that asked for it. */
export const EXPIRED_LINK_MESSAGE = 'Este enlace ya no sirve. Tiene que abrirse en el mismo navegador donde lo pediste: vuelve a pedirlo desde ahí.'

export function authErrorMessage(error: ServerError): string {
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase()
  if (text.includes('invalid') && text.includes('credentials')) return 'Email o contraseña incorrectos.'
  if (text.includes('email_not_confirmed') || text.includes('email not confirmed')) {
    return 'Esta cuenta todavía no está confirmada. Avisa al administrador.'
  }
  if (text.includes('same_password') || text.includes('different from the old')) return 'Elige una contraseña distinta a la anterior.'
  if (text.includes('weak_password') || text.includes('password should')) return 'Esa contraseña es demasiado débil. Prueba con otra más larga.'
  if (text.includes('rate') && text.includes('limit')) return 'Demasiados intentos. Espera un rato y vuelve a probar.'
  if (text.includes('session') && text.includes('missing')) return EXPIRED_LINK_MESSAGE
  return CONNECTION
}

export function teamErrorMessage(error: ServerError): string {
  const message = error.message ?? ''
  if (error.code === '23505') return message.includes('staff_name') ? 'Ya hay alguien en el equipo con ese nombre.' : 'Ya hay alguien en el equipo con ese email.'
  if (message.includes('staff_last_admin')) return 'Tiene que quedar al menos un administrador.'
  if (message.includes('staff_own_access_locked')) return 'No puedes cambiar tu propio acceso.'
  if (error.code === '42501' || message.includes('staff_field_locked')) return 'No tienes permiso para hacer esto.'
  return CONNECTION
}


/** Error that the login provider left in the address when coming back from a link. */
export function readRedirectError(search: string, hash: string): string | null {
  const inSearch = new URLSearchParams(search)
  const inHash = new URLSearchParams(hash.replace(/^#/, ''))
  return inSearch.has('error') || inHash.has('error') || inHash.has('error_code') ? EXPIRED_LINK_MESSAGE : null
}
