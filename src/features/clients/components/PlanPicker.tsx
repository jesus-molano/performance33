import { PLANS } from '@/config/plans'
import { cn } from '@/lib/cn'
import { usePlanDescriptions } from '@/features/classes'
import type { PlanId } from '@/types'

export interface PlanPickerProps {
  value: PlanId
  onChange: (plan: PlanId) => void
}

/** Plan as big radio cards: 'Plus · 3 clases/semana' (from the gym's booking rules). */
export function PlanPicker({ value, onChange }: PlanPickerProps) {
  const descriptions = usePlanDescriptions()
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-fg">Plan</span>
      <div role="radiogroup" aria-label="Plan" className="grid grid-cols-2 gap-2">
        {PLANS.map((plan) => {
          const selected = plan.id === value
          return (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(plan.id)}
              className={cn(
                'flex min-h-14 flex-col items-start justify-center rounded-xl border px-3.5 py-2 text-left transition-colors',
                selected ? 'border-brand-strong bg-brand-soft ring-1 ring-brand-strong' : 'border-line-strong hover:bg-canvas',
              )}
            >
              <span className={cn('text-md font-semibold', selected ? 'text-brand-strong' : 'text-fg')}>{plan.label}</span>
              <span className="text-sm text-fg-muted">{descriptions[plan.id]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
