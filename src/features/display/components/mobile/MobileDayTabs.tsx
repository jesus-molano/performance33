import { cn } from '@/lib/cn'
import type { DisplayDay } from '@/lib/display'
import { MOBILE_SCREEN_TEXTS } from '@/features/display/config/mobile'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface MobileDayTabsProps {
  days: DisplayDay[]
  dayNumber: number
  theme: DisplayThemeClasses
  onSelect: (dayNumber: number) => void
}

/** Sticky row of equal numbered day buttons that always fits the screen; the selected day's name goes right below. */
export function MobileDayTabs({ days, dayNumber, theme, onSelect }: MobileDayTabsProps) {
  const selected = days.find((day) => day.number === dayNumber)
  return (
    <div className={cn('sticky top-0 z-10 flex flex-col gap-1.5 px-4 py-2', theme.root)}>
      <div role="tablist" aria-label={MOBILE_SCREEN_TEXTS.dayTabs} className="grid auto-cols-fr grid-flow-col gap-2">
        {days.map((day) => {
          const active = day.number === dayNumber
          return (
            <button
              key={day.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={day.title}
              onClick={() => onSelect(day.number)}
              className={cn('tabular h-11 rounded-xl text-lg font-bold', active ? theme.badge : theme.outlineBadge)}
            >
              {day.number}
            </button>
          )
        })}
      </div>
      <p className={cn('text-lg font-semibold [overflow-wrap:anywhere]', theme.accentText)}>{selected?.title}</p>
    </div>
  )
}
