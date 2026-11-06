// The member's routine as my_routine() sends it → the formatted days and the day they do next (pure).
// Same format as the gym's screens (shared/routine), so a day reads the same on the TV and on the phone.

import type { MyRoutineResult } from '@shared/booking/memberRpc.ts'
import type { GymDate } from '@shared/booking/week.ts'
import { buildProgramRoutine } from '@shared/routine/displayRoutine.ts'
import type { ProgramRoutine } from '@shared/routine/displayTypes.ts'
import { nextRoutineDay, type NextRoutineDay } from '@shared/routine/nextDay.ts'
import { latestSessions, sessionFromRow } from '@shared/routine/sessions.ts'
import type { PublicProgram } from '@shared/routine/types.ts'

export interface MemberRoutine {
  routine: ProgramRoutine
  /** The day they do next ("Hoy te toca"); null for a routine without days. */
  next: NextRoutineDay | null
}

/**
 * `today` is the gym's date: it decides the week of the progression and whether they already trained today.
 * Null without a current routine.
 */
export function buildMemberRoutine(result: MyRoutineResult<PublicProgram>, today: GymDate): MemberRoutine | null {
  const program = result.program
  if (!program) return null
  const sessions = result.sessions.map(sessionFromRow)
  const last = latestSessions(sessions).get(program.clientId) ?? null
  const shape = { id: program.id, dayIds: program.days.map((day) => day.id) }
  return { routine: buildProgramRoutine(program, today), next: nextRoutineDay(shape, last, today) }
}
