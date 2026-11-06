import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ScreenDayOption } from '@/features/screens'

export interface RemoteDayListProps {
  days: readonly ScreenDayOption[]
  current: number
  onPick: (day: number) => void
}

/** 'Cambiar día': the days of the person's current routine, by their full title. */
export function RemoteDayList({ days, current, onPick }: RemoteDayListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {days.map((option) => {
        const selected = option.day === current
        return (
          <li key={option.day}>
            <button
              type="button"
              onClick={() => onPick(option.day)}
              aria-current={selected || undefined}
              className={cn('flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-base font-medium text-fg hover:bg-fg/5', selected && 'bg-brand-soft')}
            >
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {selected && <Check size={18} aria-hidden className="shrink-0 text-brand-strong" />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
