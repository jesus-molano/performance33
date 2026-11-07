// User-facing strings shared by several hooks/components.

export const COPY = {
  undo: 'Deshacer',
  popupBlocked: 'Se ha bloqueado la ventana. Desactiva el bloqueador de anuncios en esta web (o mira Ajustes → Pantallas).',
  openScreen: 'Abrir pantalla',
  screenWaitsForSave: 'Aún no se ha guardado todo. Inténtalo cuando vuelva la conexión.',
  undoEndsOnScreen: 'Al volver ya no podrás deshacer los cambios de antes.',
} as const

export const SYNC_MESSAGES = {
  writeRejected: 'Ese cambio no se ha guardado porque no tienes permiso.',
  librarySeedFailed: 'No hemos podido cargar la biblioteca de ejercicios. Volveremos a intentarlo la próxima vez que entres.',
} as const

export const DATE_TEXTS = {
  placeholder: 'dd/mm/aaaa',
  invalid: 'Esa fecha no existe. Escríbela como dd/mm/aaaa.',
  before: (limit: string) => `No puede ser antes del ${limit}.`,
  after: (limit: string) => `No puede ser después del ${limit}.`,
  required: 'Elige una fecha válida.',
  kept: (date: string) => `Se mantiene el ${date}.`,
  openCalendar: 'Abrir calendario',
  calendarTitle: 'Elige una fecha',
  previousMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
  today: 'Hoy',
} as const
