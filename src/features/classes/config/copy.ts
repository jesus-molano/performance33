// Texts of Clases, Ajustes → Clases and the classes card of the user's page. Spanish (Spain), "tú", few words.

import type { BookingErrorCode } from '@shared/booking'
import { plural } from '@/lib/format'

export const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const
/** One letter per day, Monday first (X = miércoles, as on Spanish calendars). */
export const WEEKDAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const
export const WEEKDAY_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'] as const
export const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'] as const

export const CLASSES_COPY = {
  title: 'Clases',
  description: 'Quién viene a cada clase. Apunta, quita o cambia a la gente de clase.',
  loading: 'Cargando clases…',
  loadFailed: 'No se han podido cargar las clases.',
  retry: 'Reintentar',
  today: 'Hoy',
  tomorrow: 'Mañana',
  yesterday: 'Ayer',
  goToday: 'Ir a hoy',
  prevWeek: 'Semana anterior',
  nextWeek: 'Semana siguiente',
  prevDay: 'Día anterior',
  nextDay: 'Día siguiente',
  noClasses: 'No hay clases este día',
  noClassesHint: 'Añade una clase suelta o cambia el horario en Ajustes → Clases.',
  noClassesPast: 'No hubo clases este día',
  addSlot: 'Añadir clase este día',
  pickSlot: 'Elige una clase para ver quién viene.',
  counts: (booked: number, capacity: number) => `${booked}/${capacity}`,
  waitlist: (count: number) => `+${count} en espera`,
  spotsLabel: (booked: number, capacity: number, waitlist: number) =>
    `${booked} de ${capacity} plazas ocupadas${waitlist ? `, ${waitlist} en espera` : ''}`,
} as const

export const SLOT_BADGE_COPY = {
  open: 'Abierta',
  full: 'Completa',
  closed: 'Reservas cerradas',
  cancelled: 'Cancelada',
  started: 'En curso',
  finished: 'Terminada',
} as const

export const ROSTER_COPY = {
  booked: 'Apuntados',
  waitlist: 'Lista de espera',
  empty: 'Nadie apuntado todavía.',
  forced: 'Forzada',
  addPerson: 'Añadir usuario',
  personMenu: (name: string) => `Opciones de ${name}`,
  slotMenu: 'Opciones de la clase',
  move: 'Mover a otra clase',
  remove: 'Quitar',
  edit: 'Editar',
  close: 'Cerrar reservas',
  open: 'Abrir reservas',
  cancel: 'Cancelar clase',
  closedNote: 'Reservas cerradas: los usuarios no pueden apuntarse.',
  cancelledNote: 'Clase cancelada.',
  finishedNote: 'Esta clase ya ha terminado.',
} as const

export const ACTION_COPY = {
  added: (name: string, time: string) => `${name}, a la clase de las ${time}`,
  removed: (name: string, time: string) => `${name} fuera de la clase de las ${time}`,
  moved: (name: string, time: string) => `${name} pasa a la clase de las ${time}`,
  overQuota: 'ya había usado sus clases de esta semana',
  promoted: (count: number) => `${plural(count, 'entra', 'entran')} de la espera`,
  closed: 'Reservas cerradas',
  opened: 'Reservas abiertas',
  cancelled: (time: string) => `Clase de las ${time} cancelada`,
  saved: 'Clase guardada',
  created: (time: string) => `Clase de las ${time} añadida`,
  fullTitle: '¿Añadir igualmente?',
  fullText: (time: string, booked: number, capacity: number, name: string) =>
    `La clase de las ${time} está completa (${booked}/${capacity}). ${name} entrará por encima del aforo.`,
  fullConfirm: 'Añadir igualmente',
  cancelTitle: (time: string) => `¿Cancelar la clase de las ${time}?`,
  cancelText: (people: number) =>
    people ? `Se quita a ${plural(people, 'persona apuntada', 'personas apuntadas')}. No se puede deshacer.` : 'No se puede deshacer.',
  cancelConfirm: 'Cancelar clase',
  cancelBack: 'Volver',
} as const

/** Refusals said about the person, not to the coach (the shared messages speak to the member). */
export const STAFF_ERROR_COPY: Partial<Record<BookingErrorCode, string>> = {
  already_booked: 'Ya está en esa clase.',
  quota_reached: 'Ya ha usado sus clases de esta semana.',
  too_far: 'Todavía no se puede reservar esta clase.',
}

export const ADD_PERSON_COPY = {
  title: 'Añadir usuario',
  description: (name: string, time: string) => `${name} · ${time}`,
  search: 'Buscar por nombre',
  none: 'No hay nadie con ese nombre.',
  alreadyAll: 'Ya están todos en esta clase.',
} as const

export const MOVE_COPY = {
  title: (name: string) => `Mover a ${name}`,
  description: 'Elige la clase nueva.',
  none: 'No hay otras clases este día.',
  current: 'Está aquí',
  alreadyIn: 'Ya está apuntado',
} as const

export const SLOT_FORM_COPY = {
  newTitle: 'Añadir clase',
  editTitle: 'Editar clase',
  name: 'Nombre',
  time: 'Hora',
  duration: 'Duración',
  capacity: 'Plazas',
  capacityError: (min: number, max: number) => `Entre ${min} y ${max}`,
  nameError: 'Ponle un nombre',
  save: 'Guardar',
  add: 'Añadir clase',
  cancel: 'Cancelar',
  editedHint: 'Los cambios del horario semanal ya no tocarán esta clase.',
  belowBooked: (booked: number) => `Ya hay ${plural(booked, 'apuntado', 'apuntados')}: nadie sale de la clase.`,
  minutes: (n: number) => `${n} min`,
} as const

export const SCHEDULE_COPY = {
  readOnly:'Solo un administrador puede cambiar esto.',
  scheduleTitle: 'Horario semanal',
  scheduleDescription: 'Las clases de cada semana salen solas de aquí. Las que ya tienen gente no se mueven.',
  addTemplate: 'Añadir clase',
  noTemplates: 'Sin clases',
  emptyTitle: 'Todavía no hay horario',
  emptyText: 'Añade las clases de la semana y aparecerán solas en Clases.',
  editLabel: (day: string, time: string, name: string) => `Editar ${day} ${time} · ${name}`,
  remove: 'Quitar del horario',
  removeTitle: (day: string, time: string) => `¿Quitar ${day} ${time} del horario?`,
  removeText: 'Dejan de crearse estas clases. Las que ya tienen gente se quedan.',
  removed: (day: string, time: string) => `${day} ${time} quitada del horario`,
  inactive: 'Pausada',
  formNew: 'Añadir al horario',
  formEdit: 'Editar clase del horario',
  days: 'Días',
  daysError: 'Elige al menos un día',
  active: 'Activa',
  activeHint: 'Pausada: no se crean clases nuevas.',
  saved: 'Horario guardado',
  savedMany: (count: number) => `${plural(count, 'clase añadida', 'clases añadidas')} al horario`,
  templateLine: (duration: number, capacity: number) => `${duration} min · ${plural(capacity, 'plaza', 'plazas')}`,
  /** Fits a phone tile: '60′ · 8 pl.'. */
  templateShort: (duration: number, capacity: number) => `${duration}′ · ${capacity} pl.`,
  rulesTitle: 'Reglas de reserva',
  rulesSaved: 'Cambios guardados',
  rulesDescription: 'Lo que pueden hacer los usuarios cuando reservan desde la app.',
  horizon: 'Reservar con antelación',
  horizonOption: (days: number) => `Hasta ${plural(days, 'día', 'días')} antes`,
  cancelUntil: 'Cancelar sin que cuente',
  cancelOption: (lead: string) => (lead ? `Hasta ${lead} antes` : 'Siempre'),
  lateCancel: 'Cancelar tarde cuenta en la semana',
  lateCancelHint: 'Si cancela después, esa clase se le descuenta.',
  waitlist: 'Lista de espera',
  waitlistHint: 'Si la clase está llena, se apuntan a la espera y entran solos.',
  promoteUntil: 'La espera funciona',
  promoteOption: (lead: string) => (lead ? `Hasta ${lead} antes` : 'Hasta que empieza'),
  plansTitle: 'Clases por semana según el plan',
  plansDescription: 'Las descripciones de los planes salen de aquí.',
  quotaNumber: (n: number) => plural(n, 'clase', 'clases'),
  quotaUnlimited: 'Sin límite',
  quotaTrainingDays: 'Sus días de entreno',
} as const

export const PLAN_QUOTA_COPY = {
  fixed: (n: number) => `${plural(n, 'clase', 'clases')}/semana`,
  unlimited: 'Clases sin límite',
  trainingDays: 'Clases según sus días',
} as const

export const CLIENT_CLASSES_COPY = {
  title: 'Clases',
  week: 'Esta semana',
  usage: (used: number, quota: number | null) => (quota === null ? `${plural(used, 'clase', 'clases')} · sin límite` : `${used} de ${quota}`),
  over: 'Ya ha usado sus clases',
  upcoming: 'Próximas clases',
  none: 'No tiene clases reservadas.',
  waitlist: (position: number | null) => (position ? `En espera · nº ${position}` : 'En espera'),
  seeAll: 'Ver clases',
  loadFailed: 'No se han podido cargar sus clases.',
} as const
