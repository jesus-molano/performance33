import type { MemberAccessStatus } from '@/features/members/types'

export const MEMBER_ACCESS_COPY = {
  title: 'Acceso a la app',
  none: 'Todavía no puede entrar en la app del gimnasio.',
  archived: 'Restaura a este usuario para darle acceso.',
  give: 'Dar acceso a la app',
  loadFailed: 'No se ha podido cargar. Revisa la conexión.',
  retry: 'Reintentar',
  status: {
    pending: 'Aún no ha entrado',
    expired: 'Su contraseña caducó: dale otra',
    active: 'Con acceso',
    paused: 'Pausado',
  } satisfies Record<MemberAccessStatus, string>,
  usernameLine: (username: string) => `Entra como «${username}»`,
  menuLabel: 'Opciones del acceso a la app',
  reset: 'Dar una contraseña nueva',
  pause: 'Pausar acceso',
  resume: 'Reactivar acceso',
  remove: 'Quitar acceso',
  qr: 'Imprime o enseña el QR',
} as const

export const GIVE_ACCESS_COPY = {
  title: 'Dar acceso a la app',
  description: (name: string) => `${name} entrará con un nombre de usuario y una contraseña temporal que le darás tú.`,
  username: 'Nombre de usuario',
  usernameHint: 'Con esto entrará. Letras sin tildes, números y . - _',
  usernameInvalid: 'De 3 a 30 letras sin tildes, números o . - _',
  email: 'Email (opcional)',
  emailHint: 'También podrá entrar con él.',
  emailInvalid: 'Este email no es válido.',
  submit: 'Dar acceso',
  cancel: 'Cancelar',
} as const

export const CREDENTIALS_COPY = {
  title: 'Datos para entrar',
  description: (name: string) => `Dáselos a ${name}. La primera vez que entre elegirá su propia contraseña.`,
  username: 'Usuario',
  password: 'Contraseña',
  copy: 'Copiar',
  copied: 'Copiado',
  copyFailed: 'No se ha podido copiar. Apúntalo a mano.',
  /** What "Copiar" puts on the clipboard. */
  clipboard: (username: string, password: string) => `Usuario: ${username}\nContraseña: ${password}`,
  warning: 'Apúntalo ahora: la contraseña no se volverá a mostrar. Sirve 3 días.',
  qrHint: 'Con el QR se descarga la app.',
  done: 'Ya lo he apuntado',
} as const

export const MEMBER_ACTION_COPY = {
  resetTitle: (name: string) => `¿Dar una contraseña nueva a ${name}?`,
  resetBody: 'La que tiene dejará de funcionar y se cerrará su sesión en la app.',
  resetConfirm: 'Crear contraseña',
  pauseTitle: (name: string) => `¿Pausar el acceso de ${name}?`,
  pauseBody: 'No podrá entrar en la app hasta que lo reactives. Sus reservas se quedan.',
  pauseConfirm: 'Pausar',
  removeTitle: (name: string) => `¿Quitar el acceso de ${name}?`,
  removeBody: 'Se borra su cuenta de la app. Su ficha y sus reservas se quedan, y puedes darle acceso otra vez.',
  removeConfirm: 'Quitar acceso',
  paused: (name: string) => `${name} ya no puede entrar en la app`,
  resumed: (name: string) => `${name} puede volver a entrar en la app`,
  removed: (name: string) => `${name} ya no tiene acceso a la app`,
  failed: 'No se ha podido hacer. Inténtalo de nuevo.',
} as const
