// The month grid of the date picker: Monday first, as in Spain.

import { DAYS_PER_WEEK } from '@/config/app'
import type { ISODate } from '@/types'
import { addDays, parseISODate, toISODate } from './dates'

export const WEEKDAY_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const


export interface CalendarMonth {
  year: number
  /** 0-based. */
  month: number
}

export function monthOf(date: ISODate): CalendarMonth {
  const d = parseISODate(date)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function shiftMonth({ year, month }: CalendarMonth, delta: number): CalendarMonth {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

/** Every day to draw for a month: whole weeks, Monday to Sunday, spilling into its neighbours. */
export function calendarDays({ year, month }: CalendarMonth): ISODate[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const leading = (first.getDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK
  const total = Math.ceil((leading + last.getDate()) / DAYS_PER_WEEK) * DAYS_PER_WEEK
  const start = addDays(toISODate(first), -leading)
  return Array.from({ length: total }, (_, index) => addDays(start, index))
}

export function isInMonth(date: ISODate, { year, month }: CalendarMonth): boolean {
  const d = parseISODate(date)
  return d.getFullYear() === year && d.getMonth() === month
}
