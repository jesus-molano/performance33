import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addGymDays, type GymDate } from '@shared/booking'
import { Button, IconButton } from '@/components/ui'
import { cn } from '@/lib/cn'
import { CLASSES_COPY } from '@/features/classes/config/copy'
import { weekStrip } from '@/features/classes/utils/dayNav'
import { formatGymDay, relativeDayName } from '@/features/classes/utils/time'

export interface DayNavigatorProps {
  date: GymDate
  today: GymDate
  onChange: (date: GymDate) => void
}

/** The week of the picked day, Monday first, with arrows to the weeks around it and the day's name below. */
export function DayNavigator({ date, today, onChange }: DayNavigatorProps) {
  const relative = relativeDayName(date, today)
  return (
    <div className="mb-5 flex flex-col gap-3">
      <div className="flex items-center gap-1 sm:gap-2">
        <IconButton icon={ChevronLeft} label={CLASSES_COPY.prevWeek} variant="ghost" onClick={() => onChange(addGymDays(date, -7))} />
        <div role="group" aria-label={formatGymDay(date)} className="grid flex-1 grid-cols-7 gap-1 sm:gap-2">
          {weekStrip(date, today).map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => onChange(day.date)}
              aria-pressed={day.isSelected}
              aria-label={formatGymDay(day.date)}
              className={cn(
                'flex h-14 flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors',
                day.isSelected ? 'bg-ink text-white' : 'bg-surface text-fg ring-1 ring-line hover:bg-canvas',
              )}
            >
              <span className={cn('text-xs', day.isSelected ? 'text-ink-muted' : 'text-fg-muted')}>{day.letter}</span>
              <span className="text-base font-semibold tabular">{day.dayOfMonth}</span>
              <span aria-hidden className={cn('size-1 rounded-full', day.isToday ? (day.isSelected ? 'bg-brand' : 'bg-brand-strong') : 'bg-transparent')} />
            </button>
          ))}
        </div>
        <IconButton icon={ChevronRight} label={CLASSES_COPY.nextWeek} variant="ghost" onClick={() => onChange(addGymDays(date, 7))} />
      </div>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-fg first-letter:uppercase">
          {relative ? `${relative} · ${formatGymDay(date)}` : formatGymDay(date)}
        </h2>
        {date !== today && (
          <Button variant="secondary" size="sm" onClick={() => onChange(today)}>
            {CLASSES_COPY.goToday}
          </Button>
        )}
      </div>
    </div>
  )
}
