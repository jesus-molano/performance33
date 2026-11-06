import { buildProgramRoutine } from '@shared/routine/displayRoutine.ts'
import type { DisplayData, ISODate, PublicClient } from '@/types'
import { todayISO } from '@/lib/dates'
import type { DisplayRoutine } from './types'

export interface BuildRoutineOptions {
  /** Program to show; default the client's current program. */
  programId?: string | null
  today?: ISODate
}

/** Formatted routine for a client (current program by default). null if client/program missing. */
export function buildDisplayRoutine(
  data: DisplayData,
  clientId: string,
  opts: BuildRoutineOptions = {},
): DisplayRoutine | null {
  const client = data.clients.find((c) => c.id === clientId)
  if (!client) return null
  const programId = opts.programId ?? client.currentProgramId
  const program = data.programs.find((p) => p.id === programId && p.clientId === clientId)
  if (!program) return null
  return {
    branding: data.branding,
    clientId: client.id,
    clientFirstName: client.firstName,
    clientColor: client.color,
    ...buildProgramRoutine(program, opts.today ?? todayISO()),
  }
}

/** Clients that can be picked on the TV (active, with a current program), sorted by first name. */
export function getDisplayableClients(data: DisplayData): PublicClient[] {
  return data.clients
    .filter((c) => !c.archived && c.currentProgramId && data.programs.some((p) => p.id === c.currentProgramId))
    .sort((a, b) => a.firstName.localeCompare(b.firstName, 'es'))
}

/** Clamp a 1-based day number into the routine's range (1 when out of range or missing). */
export function clampDayNumber(routine: Pick<DisplayRoutine, 'days'>, day: number | null | undefined): number {
  if (!day || day < 1 || day > routine.days.length) return 1
  return day
}
