import type { PasswordStrength } from '@/features/auth/utils/credentials'

export const AUTH_COPY = {
  missingCredentials: 'Escribe tu email o usuario y tu contraseña.',
  loginDescription: 'Usa tu cuenta del equipo del gimnasio.',
  forgotPassword: 'He olvidado mi contraseña',
  forgotPasswordAnswer: 'Pídele al administrador que te dé una nueva.',
  noAccessTitle: 'Tu cuenta no tiene acceso',
  noAccessBody: 'Pide acceso al administrador del gimnasio. Cuando te lo dé, vuelve a comprobarlo aquí.',
  noAccessAs: (email: string) => `Has entrado como ${email}. Pídele al administrador que te cree una cuenta con este email, o entra con otra.`,
  createPasswordTitle: 'Crea tu contraseña',
  createPasswordBody: 'La que te han dado era temporal. Elige una que solo sepas tú para poder seguir.',
  demoDescription: 'Es una demo: no metas datos reales de clientes. Lo que escribas se queda solo en este navegador, y lo verá quien entre después en él.',
  localAccountsTitle: 'Cuentas de prueba',
  localAccountNotes: {
    admin: 'Administrador',
    monitor: 'Monitor',
    nueva: 'Primer acceso: te pedirá crear una contraseña',
  } as Readonly<Record<string, string>>,
  offlineTitle: 'Sin conexión',
  offlineBody: 'No hemos podido comprobar tu cuenta. Revisa la conexión a internet y vuelve a intentarlo.',
  loadFailedTitle: 'No hemos podido cargar los datos',
  loadFailedBody: 'Revisa la conexión a internet y vuelve a intentarlo.',
}

export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrength, string> = {
  empty: '',
  short: 'Demasiado corta',
  weak: 'Seguridad baja: añade más letras, números o símbolos',
  fair: 'Seguridad media',
  strong: 'Seguridad alta',
}
