// Words of 'Mandar a pantalla' and of the screens status in the top bar.

export const SEND_COPY = {
  button: 'Pantalla',
  menuItem: 'Mandar a pantalla…',
  buttonLabel: (dayLabel: string) => `Mandar ${dayLabel} a una pantalla`,
  buttonTip: (last: string | null) =>
    last ? `Elige pantalla y sección · Ctrl+clic: directo a ${last}` : 'Elige pantalla y sección',
  title: (name: string) => `¿Dónde mandas a ${name}?`,
  description: (dayLabel: string) => `${dayLabel} · toca una sección y se coloca sola.`,
  lastHint: (last: string, isMobile: boolean) =>
    isMobile ? `Mantén pulsado el botón de pantalla del día para mandarlo directo a ${last}.` : `Ctrl+clic en «Pantalla» manda directo a ${last}.`,
  loading: 'Cargando pantallas…',
  noScreens: 'Todavía no hay pantallas. Añade una desde el menú Pantallas.',
  where: (screenName: string, section: number) => `${screenName} · Sección ${section}`,
  sent: (name: string, where: string, replaced: string | null) =>
    replaced ? `${name} → ${where} (antes: ${replaced})` : `${name} → ${where}`,
  alreadyThere: (name: string, where: string) => `${name} ya está en ${where}`,
  failed: 'No se ha podido mandar a la pantalla. Revisa la conexión e inténtalo otra vez.',
  section: (section: number) => `Sección ${section}`,
  free: 'Libre',
  here: 'Ya está aquí',
  last: 'Última',
  online: 'En la tele',
  offline: 'Sin abrir',
  offlineNote: 'Se verá al abrirla',
  open: 'Abrir',
  openLabel: (screenName: string) => `Abrir ${screenName} en su tele`,
  tileLabel: (where: string, occupant: string | null, name: string) =>
    `${where}: ${occupant ?? 'libre'}. Mandar a ${name} aquí`,
} as const

export const STATUS_COPY = {
  allOpen: (open: number, total: number) => `Pantallas ${open}/${total}`,
  someClosed: (closed: number) => `${closed} sin conexión`,
  noneOpen: 'Ninguna abierta',
  open: 'Abrir',
  label: (closedNames: readonly string[]) =>
    closedNames.length ? `Pantallas sin abrir: ${closedNames.join(', ')}. Pulsa para abrirlas.` : 'Todas las pantallas están abiertas.',
} as const
