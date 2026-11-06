// Classes per week of each plan: the words of the plan descriptions and the choices of Ajustes → Clases.

import { BOOKING_PLAN_IDS, type BookingPlanId, type BookingSettings, type QuotaRule } from '@shared/booking'
import type { SelectOption } from '@/components/ui'
import { QUOTA_NUMBER_OPTIONS } from '@/features/classes/config/classes'
import { PLAN_QUOTA_COPY, SCHEDULE_COPY } from '@/features/classes/config/copy'

/** '2 clases/semana', 'Clases sin límite', 'Clases según sus días'. */
export function planQuotaText(rule: QuotaRule): string {
  if (rule === 'unlimited') return PLAN_QUOTA_COPY.unlimited
  if (rule === 'training_days') return PLAN_QUOTA_COPY.trainingDays
  return PLAN_QUOTA_COPY.fixed(rule)
}

/** The description of every plan, from the gym's rules. */
export function planDescriptions(settings: Pick<BookingSettings, 'weeklyQuota'>): Record<BookingPlanId, string> {
  return Object.fromEntries(BOOKING_PLAN_IDS.map((plan) => [plan, planQuotaText(settings.weeklyQuota[plan])])) as Record<BookingPlanId, string>
}

export type QuotaChoice = `${number}` | 'unlimited' | 'training_days'

export const quotaChoiceOf = (rule: QuotaRule): QuotaChoice => (typeof rule === 'number' ? `${rule}` : rule)

export function quotaRuleOf(choice: QuotaChoice): QuotaRule {
  return choice === 'unlimited' || choice === 'training_days' ? choice : Number(choice)
}

/** 1-7 classes, no limit, or the person's own training days; a number saved outside them is offered too. */
export function quotaOptions(current: QuotaRule): SelectOption<QuotaChoice>[] {
  const numbers = typeof current === 'number' && !QUOTA_NUMBER_OPTIONS.includes(current) ? [...QUOTA_NUMBER_OPTIONS, current].sort((a, b) => a - b) : QUOTA_NUMBER_OPTIONS
  return [
    ...numbers.map((n) => ({ value: `${n}` as QuotaChoice, label: SCHEDULE_COPY.quotaNumber(n) })),
    { value: 'unlimited', label: SCHEDULE_COPY.quotaUnlimited },
    { value: 'training_days', label: SCHEDULE_COPY.quotaTrainingDays },
  ]
}

/** Presets of a numeric rule, with the saved value added when it is not one of them. */
export function withCurrent(presets: readonly number[], current: number): number[] {
  return presets.includes(current) ? [...presets] : [...presets, current].sort((a, b) => a - b)
}
