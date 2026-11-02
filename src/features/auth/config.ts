export const PASSWORD_MIN_LENGTH = 8

export const AUTH_COPY = {
  invalidEmail: 'Escribe un email válido.',
  missingCredentials: 'Escribe tu email y tu contraseña.',
  resetSent: 'Si ese email tiene contraseña, te llegará un mensaje con un enlace. Ábrelo en este mismo navegador. Si no llega, entra con Google o avisa al administrador.',
  noAccessTitle: 'Tu cuenta no tiene acceso',
  noAccessBody: 'Pide acceso al administrador del gimnasio. Cuando te lo dé, vuelve a comprobarlo aquí.',
  noAccessAs: (email: string) => `Has entrado como ${email}. Pide al administrador que añada este email, o entra con otra cuenta.`,
  demoDescription: 'Es una demo: no metas datos reales de clientes. Lo que escribas se queda solo en este navegador, y lo verá quien entre después en él.',
  offlineTitle: 'Sin conexión',
  offlineBody: 'No hemos podido comprobar tu cuenta. Revisa la conexión a internet y vuelve a intentarlo.',
  loadFailedTitle: 'No hemos podido cargar los datos',
  loadFailedBody: 'Revisa la conexión a internet y vuelve a intentarlo.',
} as const
