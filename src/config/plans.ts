import type { PlanId } from '../types'

export interface PlanMeta {
  id: PlanId
  label: string
  /** Short description for selects/badges. */
  description: string
  /** Default training days for this plan. */
  defaultDays: number
}

/** Ordered for selects and filters. */
export const PLANS: PlanMeta[] = [
  { id: 'standard', label: 'Standard', description: '2 días/semana', defaultDays: 2 },
  { id: 'plus', label: 'Plus', description: '3 días/semana', defaultDays: 3 },
  { id: 'elite', label: 'Elite', description: 'Ilimitado', defaultDays: 4 },
  { id: 'custom', label: 'Personalizado', description: 'Días a medida', defaultDays: 1 },
]

export const PLAN_BY_ID: Record<PlanId, PlanMeta> = {
  standard: PLANS[0],
  plus: PLANS[1],
  elite: PLANS[2],
  custom: PLANS[3],
}

/** Allowed training-days choices. */
export const TRAINING_DAY_OPTIONS = [1, 2, 3, 4, 5, 6] as const
