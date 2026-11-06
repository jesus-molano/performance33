// "Le toca" with the app's own types: the current routine and the person's last session (shared/routine/nextDay.ts).

import { nextRoutineDay, type NextRoutineDay, type RoutineShape, type SessionContext, sessionSlotFor, type TrainingSession } from '@shared/routine'
import type { GymDate } from '@shared/booking'
import { formatDayTitle } from '@/lib/format'
import { getCurrentProgram } from '@/lib/program'
import type { Client, Program } from '@/types'

export interface NextDayView extends NextRoutineDay {
  /** 'Día 3 · Pierna'. */
  label: string
}

export const routineShapeOf = (program: Pick<Program, 'id' | 'days'>): RoutineShape => ({ id: program.id, dayIds: program.days.map((day) => day.id) })

/** The current routine only when it is that person's own, as the SQL trigger joins it (a stale id of someone else's is none). */
export const ownProgram = (program: Program | null, clientId: string): Program | null => (program?.clientId === clientId ? program : null)

const ownCurrentProgram = (client: PersonFields, programs: Program[]): Program | null => ownProgram(getCurrentProgram(client, programs), client.id)

/** The day of `program` that person does next, with its title; null for no routine or one without days. */
export function nextDayOf(program: Program | null, last: TrainingSession | null, today: GymDate): NextDayView | null {
  const next = nextRoutineDay(program ? routineShapeOf(program) : null, last, today)
  const day = next && program ? program.days[next.day - 1] : undefined
  return next && day ? { ...next, label: formatDayTitle(day) } : null
}

/** The next day of everybody's current routine, by person; archived people have none (the TV shows nobody for them). */
export function nextDaysByClient(
  clients: readonly PersonFields[],
  programs: Program[],
  latest: ReadonlyMap<string, TrainingSession>,
  today: GymDate,
): Map<string, number> {
  const days = new Map<string, number>()
  for (const client of clients) {
    if (client.archived) continue
    const next = nextDayOf(ownCurrentProgram(client, programs), latest.get(client.id) ?? null, today)
    if (next) days.set(client.id, next.day)
  }
  return days
}

type PersonFields = Pick<Client, 'id' | 'archived' | 'currentProgramId'>

/** What the local dataset gives the rule (the whole AppData fits). */
export interface LocalPeople {
  clients: readonly PersonFields[]
  programs: Program[]
}

export interface LocalClassesLike {
  slots: readonly { id: string; startsAt: number; durationMinutes: number; status: 'open' | 'closed' | 'cancelled' }[]
  bookings: readonly { slotId: string; clientId: string; status: string }[]
}

/** Local test mode: who each person is (from the local dataset) and the class they are in (local bookings). */
export function localSessionContext(data: LocalPeople | null, classes: LocalClassesLike | null, now: number): SessionContext {
  const clients = new Map((data?.clients ?? []).map((client) => [client.id, client]))
  return {
    now,
    person: (clientId) => {
      const client = clients.get(clientId)
      if (!client) return null
      const program = ownCurrentProgram(client, data?.programs ?? [])
      return { archived: client.archived, routine: program ? routineShapeOf(program) : null }
    },
    slotFor: (clientId) => (classes ? sessionSlotFor(classes.slots, classes.bookings, clientId, now) : null),
  }
}
