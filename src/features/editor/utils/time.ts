// Seconds ⇄ editable value in the unit the coach chose (the store always keeps seconds).

import { parseNumber } from '../../../lib/numbers'
import { SECONDS_PER_MINUTE } from '../config'

export type TimeUnit = 'sec' | 'min'

/** Minutes when the value is a whole number of minutes ≥ 1, else seconds. */
export function preferredTimeUnit(seconds: number | null): TimeUnit {
  return seconds != null && seconds >= SECONDS_PER_MINUTE && seconds % SECONDS_PER_MINUTE === 0 ? 'min' : 'sec'
}

export function secondsToInput(seconds: number | null, unit: TimeUnit): string {
  if (seconds == null) return ''
  return String(unit === 'min' ? Math.round((seconds / SECONDS_PER_MINUTE) * 100) / 100 : seconds)
}

export function inputToSeconds(value: string, unit: TimeUnit): number | null {
  const n = parseNumber(value)
  if (n == null) return null
  return Math.max(0, Math.round(unit === 'min' ? n * SECONDS_PER_MINUTE : n))
}
