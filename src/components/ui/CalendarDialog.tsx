import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DATE_TEXTS } from '@/config/copy'
import { useCalendarMonth } from '@/hooks/useCalendarMonth'
import { isInMonth, WEEKDAY_INITIALS } from '@/lib/calendar'
import { cn } from '@/lib/cn'
import { formatDateWithWeekday, formatMonthYear, todayISO } from '@/lib/dates'
import { isDateWithinLimits, type DateLimits } from '@/lib/dateText'
import type { ISODate } from '@/types'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { Modal } from './Modal'

export interface CalendarDialogProps extends DateLimits {
  value: ISODate | ''
  onPick: (date: ISODate) => void
  onClose: () => void
}

/** Month picker in Spanish, Monday first, the same in every browser. A bottom sheet on phones. */
export function CalendarDialog({ value, min, max, onPick, onClose }: CalendarDialogProps) {
  const { month, days, previous, next } = useCalendarMonth(value)
  const today = todayISO()
  const limits = { min, max }

  return (
    <Modal open onClose={onClose} size="sm" title={DATE_TEXTS.calendarTitle} focusFirstField={false}>
      <div className="flex items-center justify-between gap-2">
        <IconButton icon={ChevronLeft} label={DATE_TEXTS.previousMonth} onClick={previous} />
        <p className="text-base font-semibold text-fg first-letter:uppercase" aria-live="polite">
          {formatMonthYear(month.year, month.month)}
        </p>
        <IconButton icon={ChevronRight} label={DATE_TEXTS.nextMonth} onClick={next} />
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-xs font-semibold text-fg-subtle" aria-hidden>
        {WEEKDAY_INITIALS.map((initial) => (
          <span key={initial} className="py-1">
            {initial}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const selected = day === value
          return (
            <button
              key={day}
              type="button"
              disabled={!isDateWithinLimits(day, limits)}
              aria-label={formatDateWithWeekday(day)}
              aria-pressed={selected}
              onClick={() => onPick(day)}
              className={cn(
                'h-11 rounded-xl text-md tabular transition-colors disabled:pointer-events-none disabled:opacity-30',
                selected ? 'bg-brand-strong font-semibold text-brand-strong-contrast' : 'hover:bg-fg/5',
                !selected && (isInMonth(day, month) ? 'text-fg' : 'text-fg-subtle/70'),
                !selected && day === today && 'font-semibold ring-1 ring-line-strong ring-inset',
              )}
            >
              {Number(day.slice(-2))}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex justify-center pb-1">
        <Button variant="ghost" disabled={!isDateWithinLimits(today, limits)} onClick={() => onPick(today)}>
          {DATE_TEXTS.today}
        </Button>
      </div>
    </Modal>
  )
}
