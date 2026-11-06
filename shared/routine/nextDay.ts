// "Le toca": the day of the current routine a person does next, from the last day they did (see sessions.ts).

import type { GymDate } from '../booking/week.ts'
import type { TrainingSession } from './sessions.ts'

/** The current routine, as far as the next day goes: its id and the ids of its days in order. */
export interface RoutineShape {
  id: string
  dayIds: readonly string[]
}

/**
 * Why that day: `first` (nothing done yet in this routine: a new one starts at Día 1), `today` (already trained today:
 * the same day again), `next` (the one after the last), `cycle` (the last was the last day: back to Día 1).
 */
export type NextDayReason = 'first' | 'today' | 'next' | 'cycle'

export interface NextRoutineDay {
  /** 1-based. */
  day: number
  reason: NextDayReason
}

type LastSession = Pick<TrainingSession, 'gymDate' | 'programId' | 'dayId' | 'dayNumber'>

const clampIndex = (index: number, length: number) => Math.min(Math.max(index, 0), length - 1)

/**
 * The next day of `routine` after `last` (the person's latest session), on `today`. A day removed since keeps its
 * place: the same position today, and next comes the day that moved into its place. Null for a routine without days.
 */
export function nextRoutineDay(routine: RoutineShape | null, last: LastSession | null, today: GymDate): NextRoutineDay | null {
  const count = routine?.dayIds.length ?? 0
  if (!routine || count === 0) return null
  if (!last || last.programId !== routine.id) return { day: 1, reason: 'first' }
  const found = last.dayId === null ? -1 : routine.dayIds.indexOf(last.dayId)
  if (last.gymDate >= today) {
    return { day: clampIndex(found >= 0 ? found : last.dayNumber - 1, count) + 1, reason: 'today' }
  }
  const next = found >= 0 ? found + 1 : Math.max(last.dayNumber - 1, 0)
  return next >= count ? { day: 1, reason: 'cycle' } : { day: next + 1, reason: 'next' }
}
