// Words of 'Pantallas' on a phone: a remote control of what each gym screen shows (the windows open from the laptop).

export const REMOTE_COPY = {
  title: 'Qué sale en cada pantalla',
  /** Changes show at once only on the screens whose window is open on the laptop. */
  description: (anyOpen: boolean) =>
    `Toca una sección para cambiar quién sale. ${anyOpen ? 'Se ve al momento en las pantallas abiertas.' : 'Se verá cuando se abran desde el portátil.'}`,
  /** The one line about what only the laptop does. */
  laptopOnly: 'Las pantallas se abren desde el portátil del gimnasio.',
  loading: 'Cargando pantallas…',
  noScreens: 'Todavía no hay pantallas. Se crean desde el portátil del gimnasio.',
  online: 'Abierta',
  offline: 'Sin abrir en el portátil',
  free: 'Libre',
  day: (day: number) => `Día ${day}`,
  tileLabel: (where: string, name: string | null, dayLabel: string | null) =>
    `${where}: ${name ? `${name}, ${dayLabel ?? ''}` : 'libre'}. Toca para cambiarla`,
  sectionDescription: (name: string | null, dayLabel: string | null) => (name ? `Ahora: ${name} · ${dayLabel ?? ''}` : 'Ahora está libre.'),
  changePerson: 'Cambiar persona',
  putPerson: 'Poner a alguien',
  changeDay: 'Cambiar día',
  remove: 'Quitar',
  swapWith: 'Cambiar de sitio con',
  swapLabel: (where: string, name: string | null) => `Cambiar de sitio con ${where} (${name ?? 'libre'})`,
  back: 'Volver',
  personTitle: '¿Quién sale aquí?',
  dayTitle: '¿Qué día?',
  searchLabel: 'Buscar persona',
  searchPlaceholder: 'Busca por nombre',
  noResults: 'No hay nadie con rutina con ese nombre.',
  nobodyWithRoutine: 'Todavía no hay nadie con rutina.',
  current: 'Ahora aquí',
  shownAt: (where: string) => `En ${where}`,
  dayChanged: (name: string, day: number, where: string) => `${name} · Día ${day} en ${where}`,
  removed: (name: string | null, where: string) => `${name ?? 'Nadie'} sale de ${where}`,
  swapped: (screenName: string, a: number, b: number) => `${screenName}: secciones ${a} y ${b} cambiadas de sitio`,
} as const
