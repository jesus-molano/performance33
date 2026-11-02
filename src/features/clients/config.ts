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

export const CLIENT_LIST_COLUMN_TITLES = ['Usuario', 'Plan', 'Rutina', 'Semana', 'Importante'] as const

export type PlanFilter = PlanId | 'all'

export const PLAN_FILTER_OPTIONS: ReadonlyArray<{ value: PlanFilter; label: string }> = [
  { value: 'all', label: 'Todos los planes' },
  ...PLANS.map((plan) => ({ value: plan.id, label: plan.label })),
]

/** Quick choices for a new routine's length. */
export const PROGRAM_WEEK_CHOICES = [3, 4, 5, 6] as const

export const CLIENT_TEXT = {
  notePlaceholder: 'Ej.: Molestia en el hombro derecho, evitar press por encima de la cabeza.',
  goalPlaceholder: 'Ej.: Perder grasa y ganar fuerza en el tren inferior.',
  pinHelp: 'Se verá arriba en su ficha y en la lista de usuarios.',
} as const
