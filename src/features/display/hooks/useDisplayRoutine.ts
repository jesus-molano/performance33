import { useMemo } from 'react'
import { buildDisplayRoutine, clampDayNumber, type DisplayDay, type DisplayRoutine } from '../../../lib/display'
import type { DisplayData } from '../../../types'

export interface DisplayRoutineState {
  routine: DisplayRoutine | null
  /** Clamped 1-based day. */
  dayNumber: number
  day: DisplayDay | null
}

/** Formatted routine + selected day for a client from sanitised data. */
export function useDisplayRoutine(
  data: DisplayData | null,
  clientId: string | null,
  requestedDay: number | null,
  programId: string | null = null,
): DisplayRoutineState {
  const routine = useMemo(
    () => (data && clientId ? buildDisplayRoutine(data, clientId, { programId }) : null),
    [data, clientId, programId],
  )
  const dayNumber = routine ? clampDayNumber(routine, requestedDay) : 1
  return { routine, dayNumber, day: routine?.days[dayNumber - 1] ?? null }
}
