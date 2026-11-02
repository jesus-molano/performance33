import { useState } from 'react'
import { calendarDays, monthOf, shiftMonth, type CalendarMonth } from '@/lib/calendar'
import { todayISO } from '@/lib/dates'
import type { ISODate } from '@/types'

export interface CalendarMonthApi {
  month: CalendarMonth
  days: ISODate[]
  previous: () => void
  next: () => void
}

/** The month on show in the date picker: starts on the chosen date, or on today. */
export function useCalendarMonth(selected: ISODate | ''): CalendarMonthApi {
  const [month, setMonth] = useState(() => monthOf(selected || todayISO()))
  return {
    month,
    days: calendarDays(month),
    previous: () => setMonth((current) => shiftMonth(current, -1)),
    next: () => setMonth((current) => shiftMonth(current, 1)),
  }
}
