// Local-date helpers. All calendar dates are 'YYYY-MM-DD' strings interpreted in
// LOCAL time (never `new Date('2026-10-31')`, which is UTC and shifts a day).
// The core ones live in shared/routine/dates.ts (shared with the members' app).

import { DAYS_PER_WEEK } from '@/config/app'
import type { ISODate } from '@/types'
import { addDays, diffDays, formatDate, parseISODate, todayISO, toISODate } from '@shared/routine/dates.ts'

export { addDays, diffDays, formatDate, isValidISODate, parseISODate, todayISO, toISODate } from '@shared/routine/dates.ts'

const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

const pad = (n: number) => String(n).padStart(2, '0')

export function addWeeks(iso: ISODate, n: number): ISODate {
  return addDays(iso, n * DAYS_PER_WEEK)
}

/** Inclusive end date for a program of `weeks` weeks starting on `start`. */
export function endDateFor(start: ISODate, weeks: number): ISODate {
  return addDays(start, Math.max(1, weeks) * DAYS_PER_WEEK - 1)
}

/** Weeks needed to cover start..end inclusive (≥1). */
export function weeksBetween(start: ISODate, end: ISODate): number {
  return Math.max(1, Math.ceil((diffDays(start, end) + 1) / DAYS_PER_WEEK))
}

/** 'sábado, 31 de octubre'. */
export function formatDateWithWeekday(iso: ISODate): string {
  const d = parseISODate(iso)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`
}

/** 'octubre de 2026'. `month` is 0-based. */
export function formatMonthYear(year: number, month: number): string {
  return `${MONTHS_LONG[month]} de ${year}`
}

/** '27/10/2026 – 23/11/2026'. */
export function formatDateRange(start: ISODate, end: ISODate): string {
  return `${formatDate(start)} – ${formatDate(end)}`
}

/** Timestamp → 'hoy, 10:42' / 'ayer, 18:05' / '12/10/2026, 09:30'. */
export function formatDateTime(isoDateTime: string): string {
  const d = new Date(isoDateTime)
  if (Number.isNaN(d.getTime())) return ''
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const delta = diffDays(toISODate(d), todayISO())
  if (delta === 0) return `hoy, ${time}`
  if (delta === 1) return `ayer, ${time}`
  return `${formatDate(toISODate(d))}, ${time}`
}

