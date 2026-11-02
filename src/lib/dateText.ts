// What a coach types in a date field: always dd/mm/aaaa, never the browser's format.

import { DATE_INPUT_YEARS, DATE_PART_LENGTHS } from '@/config/app'
import { DATE_TEXTS } from '@/config/copy'
import type { ISODate } from '@/types'
import { formatDate, isValidISODate } from './dates'

/** Length of a complete 'dd/mm/aaaa'. */
export const DATE_TEXT_LENGTH = 10

const SEPARATOR = /[/.\-\s]/
const ISO_PREFIX = /^\s*(\d{4})-(\d{2})-(\d{2})/

/**
 * Keeps the field in dd/mm/aaaa while typing: the slashes appear by themselves, '2/' becomes '02/',
 * and a pasted '2026-10-23' is turned around. A slash is never added at the end, so backspace works.
 * Only the separator just typed pads: inside a date being corrected ('03/1/2026') that would complete
 * it with a wrong day before the coach has finished.
 */
export function maskDateText(raw: string): string {
  const iso = ISO_PREFIX.exec(raw)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  const parts = ['']
  const lastPart = DATE_PART_LENGTHS.length - 1
  for (const [index, char] of [...raw].entries()) {
    const last = parts.length - 1
    if (/\d/.test(char)) {
      if (parts[last].length < DATE_PART_LENGTHS[last]) parts[last] += char
      else if (last < lastPart) parts.push(char)
    } else if (SEPARATOR.test(char) && last < lastPart && parts[last]) {
      if (index === raw.length - 1) parts[last] = parts[last].padStart(DATE_PART_LENGTHS[last], '0')
      parts.push('')
    }
  }
  return parts.join('/')
}

/** '23/10/2026', also '23-10-26' or '3.2.2026' → ISO date. Null when that day does not exist. */
export function parseDateText(text: string): ISODate | null {
  const parts = text.trim().split(SEPARATOR)
  if (parts.length !== 3 || !parts.every((part) => /^\d+$/.test(part))) return null
  const [day, month, year] = parts
  if (day.length > 2 || month.length > 2 || (year.length !== 2 && year.length !== 4)) return null
  const fullYear = year.length === 2 ? `20${year}` : year
  if (Number(fullYear) < DATE_INPUT_YEARS.min || Number(fullYear) > DATE_INPUT_YEARS.max) return null
  const iso = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  return isValidISODate(iso) ? iso : null
}

export interface DateLimits {
  min?: ISODate
  max?: ISODate
}

/** True when the date is inside the limits. ISO dates compare correctly as text. */
export function isDateWithinLimits(date: ISODate, { min, max }: DateLimits): boolean {
  return (!min || date >= min) && (!max || date <= max)
}

export type DateTextResult = { date: ISODate; error: null } | { date: null; error: string }

/** The date in the text, or the message that explains what is wrong with it. */
export function readDateText(text: string, limits: DateLimits = {}): DateTextResult {
  const date = parseDateText(text)
  if (!date) return { date: null, error: DATE_TEXTS.invalid }
  if (limits.min && date < limits.min) return { date: null, error: DATE_TEXTS.before(formatDate(limits.min)) }
  if (limits.max && date > limits.max) return { date: null, error: DATE_TEXTS.after(formatDate(limits.max)) }
  return { date, error: null }
}
