import { LayoutGrid, List, type LucideIcon } from 'lucide-react'
import { PLANS } from '@/config/plans'
import type { PlanId } from '@/types'

export type ClientView = 'grid' | 'list'

export const DEFAULT_CLIENT_VIEW: ClientView = 'grid'
export const CLIENT_VIEW_STORAGE_KEY = 'p33:clients:view'

export const CLIENT_VIEW_OPTIONS: ReadonlyArray<{ value: ClientView; label: string; icon: LucideIcon }> = [
  { value: 'grid', label: 'Cuadrícula', icon: LayoutGrid },
  { value: 'list', label: 'Lista', icon: List },
]

/** Columns of the list view, shared by its heading and its rows (stacked below xl, where the sidebar leaves too little width). */
export const CLIENT_ROW_COLUMNS =
  'grid items-center gap-x-4 gap-y-2 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.2fr)]'

/** Width of the row actions ('Pantalla' and '⋯'), shared by the list heading and its rows. */
export const CLIENT_ROW_ACTIONS_WIDTH = 'w-[6.25rem] sm:w-[9.5rem]'

export const CLIENT_LIST_COLUMN_TITLES = ['Usuario', 'Plan', 'Rutina', 'Semana', 'Importante'] as const

export type PlanFilter = PlanId | 'all'

export const PLAN_FILTER_OPTIONS: ReadonlyArray<{ value: PlanFilter; label: string }> = [
  { value: 'all', label: 'Todos los planes' },
  ...PLANS.map((plan) => ({ value: plan.id, label: plan.label })),
]

/** The same on phones, where the select shares its row with the chips: 'Todos' fits without being cut. */
export const PLAN_FILTER_OPTIONS_SHORT: ReadonlyArray<{ value: PlanFilter; label: string }> = PLAN_FILTER_OPTIONS.map((option) =>
  option.value === 'all' ? { ...option, label: 'Todos' } : option,
)

/** Quick choices for a new routine's length. */
export const PROGRAM_WEEK_CHOICES = [3, 4, 5, 6] as const

/** 'Pantalla' on each user of the list: which day of the current routine goes to the TV. */
export const CLIENT_SCREEN_COPY = {
  noRoutine: 'Sin rutina',
  buttonLabel: (name: string) => `Mandar a ${name} a una pantalla`,
  dayGroup: '¿Qué día?',
  dayChip: (day: number) => `Día ${day}`,
} as const

/** Where a user shows on the screens now: badge in the list, line on their page, 'En pantalla' filter. */
export const CLIENT_PLACEMENT_COPY = {
  label: (where: string) => `Sale en ${where}`,
  filter: 'En pantalla',
  filterLabel: (count: number) => `En pantalla (${count})`,
  filterTip: 'Ver solo quién sale ahora en una pantalla',
  remove: 'Quitar de la pantalla',
  removed: (name: string, where: string) => `${name} ya no sale en ${where}`,
  failed: 'No se ha podido quitar de la pantalla. Revisa la conexión e inténtalo otra vez.',
} as const

export const CLIENT_TEXT = {
  notePlaceholder: 'Ej.: Molestia en el hombro derecho, evitar press por encima de la cabeza.',
  goalPlaceholder: 'Ej.: Perder grasa y ganar fuerza en el tren inferior.',
  pinHelp: 'Se verá arriba en su ficha y en la lista de usuarios.',
} as const

/** The '⋯' of a user (card, list row and their page). */
export const CLIENT_MENU_COPY = {
  label: 'Más acciones del usuario',
  edit: 'Editar datos',
  archive: 'Archivar usuario',
  restore: 'Restaurar usuario',
  remove: 'Eliminar usuario…',
} as const

/** The header of a user's page. */
export const CLIENT_PROFILE_COPY = {
  memberSince: (date: string) => `Usuario desde el ${date}`,
  goal: 'Objetivo:',
  goalPrivate: 'Solo monitores',
  archived: 'Archivado',
  showMore: 'Ver objetivo completo y fecha de alta',
  showLess: 'Ver menos',
} as const
