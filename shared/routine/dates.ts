// Local-date helpers. All calendar dates are 'YYYY-MM-DD' strings interpreted in
// LOCAL time (never `new Date('2026-10-31')`, which is UTC and shifts a day).

import type { ISODate } from './types.ts'

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

/** Whole calendar days from a to b (b - a). Safe across DST. */
export function diffDays(a: ISODate, b: ISODate): number {
  const da = parseISODate(a)
  const db = parseISODate(b)
  return Math.round((Date.UTC(db.getFullYear(), db.getMonth(), db.getDate()) -
    Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) / 86400000)
}

/** '31/10/2026': how every date reads in the app, whatever the browser's language. */
export function formatDate(iso: ISODate): string {
  const d = parseISODate(iso)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}
