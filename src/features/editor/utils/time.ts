// Seconds ⇄ editable value in the unit the coach chose (the store always keeps seconds).

import { formatNumber, parseNumber } from '@/lib/numbers'
import { SECONDS_PER_MINUTE } from '@/features/editor/config'

export type TimeUnit = 'sec' | 'min'

/** Minutes when the value is a whole number of minutes ≥ 1, else seconds. */
export function preferredTimeUnit(seconds: number | null): TimeUnit {
  return seconds != null && seconds >= SECONDS_PER_MINUTE && seconds % SECONDS_PER_MINUTE === 0 ? 'min' : 'sec'
}

/** '90' (s) or '1,5' (min). */
export function secondsToInput(seconds: number | null, unit: TimeUnit): string {
  if (seconds == null) return ''
  return formatNumber(unit === 'min' ? seconds / SECONDS_PER_MINUTE : seconds)
}

/** '' → null; '1,5' min → 90. undefined while the text is not a number. */
export function inputToSeconds(value: string, unit: TimeUnit): number | null | undefined {
  if (value.trim() === '') return null
  const n = parseNumber(value)
  if (n == null) return undefined
  return Math.max(0, Math.round(unit === 'min' ? n * SECONDS_PER_MINUTE : n))
}

/** Optional decimal measure (metres, calories): '' → null, '1,5' → 1.5, undefined when invalid. */
export function inputToOptionalNumber(value: string): number | null | undefined {
  if (value.trim() === '') return null
  return parseNumber(value) ?? undefined
}

export const optionalNumberToInput = (n: number | null): string => (n == null ? '' : formatNumber(n))
