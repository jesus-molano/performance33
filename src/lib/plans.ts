import { PLAN_BY_ID } from '@/config/plans'
import type { PlanId } from '@/types'

/** '3 días/semana' / '1 día/semana'. */
export function formatTrainingDays(days: number): string {
  return `${days} ${days === 1 ? 'día' : 'días'}/semana`
}

/** 'Plus · 3 días/semana' (or just 'Plus' without trainingDays). */
export function planLabel(plan: PlanId, trainingDays?: number): string {
  const meta = PLAN_BY_ID[plan] ?? PLAN_BY_ID.custom
  return trainingDays == null ? meta.label : `${meta.label} · ${formatTrainingDays(trainingDays)}`
}
