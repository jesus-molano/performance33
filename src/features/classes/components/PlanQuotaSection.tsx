import { Select } from '@/components/ui'
import { PLANS } from '@/config/plans'
import { SettingsSection } from '@/features/settings/components/SettingsSection'
import { SCHEDULE_COPY } from '@/features/classes/config/copy'
import type { BookingRulesEditor } from '@/features/classes/hooks/useBookingRulesEditor'
import { planQuotaText } from '@/features/classes/utils/planQuota'

/** Classes per week of each plan; the plan descriptions everywhere come from here. */
export function PlanQuotaSection({ editor, canEdit }: { editor: BookingRulesEditor; canEdit: boolean }) {
  return (
    <SettingsSection title={SCHEDULE_COPY.plansTitle} description={SCHEDULE_COPY.plansDescription}>
      <ul className="flex flex-col divide-y divide-line">
        {PLANS.map((plan) => (
          <li key={plan.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-md font-semibold text-fg">{plan.label}</p>
              <p className="text-sm text-fg-muted">{planQuotaText(editor.settings.weeklyQuota[plan.id])}</p>
            </div>
            <Select
              aria-label={`${SCHEDULE_COPY.plansTitle}: ${plan.label}`}
              options={editor.quotaOptionsFor(plan.id)}
              value={editor.quotaChoice(plan.id)}
              onChange={(choice) => editor.setQuota(plan.id, choice)}
              disabled={!canEdit}
              containerClassName="sm:w-56"
            />
          </li>
        ))}
      </ul>
    </SettingsSection>
  )
}
