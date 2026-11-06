// Ajustes → Clases, booking rules and weekly classes per plan: the choices offered and saving each change at once.

import type { BookingPlanId, BookingSettings } from '@shared/booking'
import type { SelectOption } from '@/components/ui'
import { CANCEL_MINUTE_OPTIONS, HORIZON_DAY_OPTIONS, PROMOTE_MINUTE_OPTIONS } from '@/features/classes/config/classes'
import { SCHEDULE_COPY } from '@/features/classes/config/copy'
import { quotaChoiceOf, quotaOptions, quotaRuleOf, withCurrent, type QuotaChoice } from '@/features/classes/utils/planQuota'
import { formatLeadTime } from '@/features/classes/utils/time'
import { useScheduleActions } from './useScheduleActions'

type NumberRule = 'horizonDays' | 'cancelUntilMinutes' | 'promoteUntilMinutes'

export interface BookingRulesEditor {
  settings: BookingSettings
  options: Record<NumberRule, SelectOption[]>
  setNumber: (rule: NumberRule, value: string) => void
  setFlag: (rule: 'lateCancelCounts' | 'waitlistEnabled', value: boolean) => void
  quotaChoice: (plan: BookingPlanId) => QuotaChoice
  quotaOptionsFor: (plan: BookingPlanId) => SelectOption<QuotaChoice>[]
  setQuota: (plan: BookingPlanId, choice: QuotaChoice) => void
}

const toOptions = (values: number[], label: (value: number) => string): SelectOption[] => values.map((value) => ({ value: String(value), label: label(value) }))

export function useBookingRulesEditor(settings: BookingSettings): BookingRulesEditor {
  const { saveSettings } = useScheduleActions()
  const save = (patch: Partial<BookingSettings>) => saveSettings({ ...settings, ...patch })

  return {
    settings,
    options: {
      horizonDays: toOptions(withCurrent(HORIZON_DAY_OPTIONS, settings.horizonDays), SCHEDULE_COPY.horizonOption),
      cancelUntilMinutes: toOptions(withCurrent(CANCEL_MINUTE_OPTIONS, settings.cancelUntilMinutes), (m) => SCHEDULE_COPY.cancelOption(formatLeadTime(m))),
      promoteUntilMinutes: toOptions(withCurrent(PROMOTE_MINUTE_OPTIONS, settings.promoteUntilMinutes), (m) => SCHEDULE_COPY.promoteOption(formatLeadTime(m))),
    },
    setNumber: (rule, value) => save({ [rule]: Number(value) }),
    setFlag: (rule, value) => save({ [rule]: value }),
    quotaChoice: (plan) => quotaChoiceOf(settings.weeklyQuota[plan]),
    quotaOptionsFor: (plan) => quotaOptions(settings.weeklyQuota[plan]),
    setQuota: (plan, choice) => save({ weeklyQuota: { ...settings.weeklyQuota, [plan]: quotaRuleOf(choice) } }),
  }
}
