// Local-date helpers. All calendar dates are 'YYYY-MM-DD' strings interpreted in
// LOCAL time (never `new Date('2026-10-31')`, which is UTC and shifts a day).

import type { ISODate } from '@/types'

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

const pad = (n: number) => String(n).padStart(2, '0')

/** Date → 'YYYY-MM-DD' using local fields. */
export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 'YYYY-MM-DD' → Date at local midnight. Invalid input → today. */
export function parseISODate(iso: ISODate): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  if (!m) {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), t.getDate())
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

export function isValidISODate(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && toISODate(parseISODate(iso)) === iso
}

/** Today's local date. */
export function todayISO(): ISODate {
  return toISODate(new Date())
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function addWeeks(iso: ISODate, n: number): ISODate {
  return addDays(iso, n * 7)
}

/** Whole calendar days from a to b (b - a). Safe across DST. */
export function diffDays(a: ISODate, b: ISODate): number {
  const da = parseISODate(a)
  const db = parseISODate(b)
  return Math.round((Date.UTC(db.getFullYear(), db.getMonth(), db.getDate()) -
    Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) / 86400000)
}

/** Inclusive end date for a program of `weeks` weeks starting on `start`. */
export function endDateFor(start: ISODate, weeks: number): ISODate {
  return addDays(start, Math.max(1, weeks) * 7 - 1)
}

/** Weeks needed to cover start..end inclusive (≥1). */
export function weeksBetween(start: ISODate, end: ISODate): number {
  return Math.max(1, Math.ceil((diffDays(start, end) + 1) / 7))
}

/** '31 oct' (adds year if different from current year: '31 oct 2025'). */
export function formatDateShort(iso: ISODate): string {
  const d = parseISODate(iso)
  const base = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
  return d.getFullYear() === new Date().getFullYear() ? base : `${base} ${d.getFullYear()}`
}

/** '31 de octubre de 2026'. */
export function formatDateLong(iso: ISODate): string {
  const d = parseISODate(iso)
  return `${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()}`
}

/** 'sábado, 31 de octubre'. */
export function formatDateWithWeekday(iso: ISODate): string {
  const d = parseISODate(iso)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`
}

/** '27 oct – 23 nov'. */
export function formatDateRange(start: ISODate, end: ISODate): string {
  return `${formatDateShort(start)} – ${formatDateShort(end)}`
}

/** Timestamp → 'hoy, 10:42' / 'ayer, 18:05' / '12 oct, 09:30'. */
export function formatDateTime(isoDateTime: string): string {
  const d = new Date(isoDateTime)
  if (Number.isNaN(d.getTime())) return ''
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const delta = diffDays(toISODate(d), todayISO())
  if (delta === 0) return `hoy, ${time}`
  if (delta === 1) return `ayer, ${time}`
  return `${formatDateShort(toISODate(d))}, ${time}`
}

/** 'hace 3 días', 'en 2 días', 'hoy', 'mañana', 'ayer'. */
export function formatRelativeDays(iso: ISODate, today: ISODate = todayISO()): string {
  const n = diffDays(today, iso)
  if (n === 0) return 'hoy'
  if (n === 1) return 'mañana'
  if (n === -1) return 'ayer'
  return n > 0 ? `en ${n} días` : `hace ${-n} días`
}
