import { PLANS } from '@/config/plans'
import type { PlanId } from '@/types'

export type PlanFilter = PlanId | 'all'

export const PLAN_FILTER_OPTIONS: ReadonlyArray<{ value: PlanFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  ...PLANS.map((plan) => ({ value: plan.id, label: plan.label })),
]

/** Quick choices for a new routine's length. */
export const PROGRAM_WEEK_CHOICES = [3, 4, 5, 6] as const

export const CLIENT_TEXT = {
  notePlaceholder: 'Ej.: Molestia en el hombro derecho, evitar press por encima de la cabeza.',
  goalPlaceholder: 'Ej.: Perder grasa y ganar fuerza en el tren inferior.',
  pinHelp: 'Se verá arriba en su ficha y en la lista de clientes.',
} as const
