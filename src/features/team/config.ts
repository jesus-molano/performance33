import type { SelectOption } from '@/components/ui'
import type { ProfileRole } from '@/types'

export const ROLE_LABELS: Record<ProfileRole, string> = {
  admin: 'Administrador',
  monitor: 'Monitor',
}

export const ROLE_OPTIONS: ReadonlyArray<SelectOption<ProfileRole>> = [
  { value: 'monitor', label: ROLE_LABELS.monitor },
  { value: 'admin', label: ROLE_LABELS.admin },
]

export const TEAM_COPY = {
  panelTitle: 'Equipo',
  panelDescription: 'Solo pueden entrar las personas con cuenta aquí.',
  createTitle: 'Crear cuenta',
  createHint: 'Al crearla verás una contraseña temporal para dársela a esa persona. La primera vez que entre elegirá la suya.',
  usernameHint: 'Con esto entrará. Letras sin tildes, números y . - _',
  emailHint: 'Opcional. Quien tenga la cuenta de Google de este email entrará con ella: revisa que esté bien escrito.',
  confirmEmailTitle: '¿Es correcto este email?',
  confirmEmailBody: (email: string, name: string) => `Quien tenga la cuenta de Google de ${email} podrá entrar como ${name}.`,
  confirmEmailAction: 'Sí, crear la cuenta',
  loadFailed: 'No hemos podido cargar las cuentas. Revisa la conexión a internet.',
  saveFailed: 'No se ha podido guardar.',
  statusNoAccess: 'Sin acceso',
  statusPending: 'Aún no ha creado su contraseña',
  noEmail: 'Sin email',
  temporaryTitle: 'Contraseña temporal',
  temporaryWarning: 'Apúntala ahora: no se volverá a mostrar. Si se pierde, tendrás que crear otra.',
  temporaryInstructions: 'Dásela en persona. La primera vez que entre tendrá que elegir una suya.',
  copy: 'Copiar',
  copied: 'Copiada',
  copyFailed: 'No se ha podido copiar. Selecciónala y cópiala a mano.',
  googleConnected: 'Ya puedes entrar con esta cuenta de Google.',
  googleConnect: 'Conectar con Google',
  googleDisconnect: 'Desconectar',
  googleDisconnected: 'Google desconectado',
  googleTitle: 'Google',
  googleOnlyMethod: 'Es tu única forma de entrar: crea una contraseña para poder desconectarlo.',
  googleConnectedBadge: 'Google conectado',
  googleNotConnected: 'Conéctalo para entrar sin escribir la contraseña.',
  passwordTitle: 'Cambiar mi contraseña',
  passwordChanged: 'Contraseña cambiada',
  currentPassword: 'Contraseña actual',
  currentPasswordWrong: 'La contraseña actual no es correcta.',
} as const
