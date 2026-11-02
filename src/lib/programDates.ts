import { MAX_PROGRAM_WEEKS } from '@/config/app'
import type { ISODate, Program, ProgramDatesPatch } from '@/types'
import { addDays, diffDays, endDateFor, isValidISODate, todayISO, weeksBetween } from './dates'
import { clamp } from './numbers'

type ProgramDates = Pick<Program, 'startDate' | 'endDate' | 'weeks'>

/**
 * Applies a date edit keeping start/end/weeks consistent:
 * weeks → recomputes endDate; endDate → recomputes weeks (end never before start, never past the longest routine);
 * startDate alone → moves the whole block, keeping its exact length. Invalid values are ignored.
 */
export function applyProgramDates(current: ProgramDates, patch: ProgramDatesPatch): ProgramDates {
  const startDate = patch.startDate && isValidISODate(patch.startDate) ? patch.startDate : current.startDate
  if (patch.weeks != null && patch.weeks >= 1) {
    const weeks = clamp(Math.round(patch.weeks), 1, MAX_PROGRAM_WEEKS)
    return { startDate, weeks, endDate: endDateFor(startDate, weeks) }
  }
  if (patch.endDate && isValidISODate(patch.endDate)) {
    const latest = endDateFor(startDate, MAX_PROGRAM_WEEKS)
    const endDate = diffDays(startDate, patch.endDate) < 0 ? startDate : diffDays(latest, patch.endDate) > 0 ? latest : patch.endDate
    return { startDate, endDate, weeks: weeksBetween(startDate, endDate) }
  }
  const length = Math.max(0, diffDays(current.startDate, current.endDate))
  return { startDate, weeks: current.weeks, endDate: addDays(startDate, length) }
}

/** Start date for the next block after `previous`: the day after it ends, or today if that is past. */
export function nextBlockStart(previous: Pick<Program, 'endDate'>, today: ISODate = todayISO()): ISODate {
  const afterEnd = addDays(previous.endDate, 1)
  return diffDays(today, afterEnd) > 0 ? afterEnd : today
}
