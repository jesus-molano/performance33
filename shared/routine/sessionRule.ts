// The rule of the `record_training_session` trigger (supabase/schema.sql), for local test mode. The same case table
// (sessionCases.ts) runs against both: change one, change the other.
//  - Someone shown in a section (new there, or another day): today's session of that person is that day of their
//    current routine (a day past the last counts as the last), with the class they hold a place in now. One per day:
//    sending again changes the day and keeps when it was first recorded.
//  - Someone leaving a section who is on no other one, within SESSION_UNDO_MINUTES of today's session being first
//    recorded: it was a mistake, today's session goes. Later, it stays (they trained).
//  - Archived people and people without a current routine with days are never recorded.

import { FILL_LEAD_MINUTES, MINUTE_MS, type SlotStatus } from '../booking/constants.ts'
import { toGymDate } from '../booking/week.ts'
import { SESSION_UNDO_MINUTES, type TrainingSession } from './sessions.ts'

/** A row of `screen_sections`: id 'N:M', who it shows and which day. */
export interface ShownSection {
  id: string
  clientId: string | null
  day: number
}

/** What the rule needs of a person: whether archived, and their current routine (null: none). */
export interface SessionPerson {
  archived: boolean
  routine: { id: string; dayIds: readonly string[] } | null
}

export interface SessionContext {
  /** Epoch ms. */
  now: number
  person: (clientId: string) => SessionPerson | null
  /** The class that person has a place in right now (sessionSlotFor), or null. */
  slotFor: (clientId: string) => string | null
}

function record(sessions: TrainingSession[], clientId: string, day: number, ctx: SessionContext): TrainingSession[] {
  const person = ctx.person(clientId)
  const dayIds = person?.routine?.dayIds ?? []
  if (!person || person.archived || !person.routine || dayIds.length === 0) return sessions
  const gymDate = toGymDate(ctx.now)
  const dayNumber = Math.min(day, dayIds.length)
  const existing = sessions.find((s) => s.clientId === clientId && s.gymDate === gymDate)
  const session: TrainingSession = {
    clientId,
    gymDate,
    programId: person.routine.id,
    dayId: dayIds[dayNumber - 1] ?? null,
    dayNumber,
    slotId: ctx.slotFor(clientId) ?? existing?.slotId ?? null,
    createdAt: existing?.createdAt ?? ctx.now,
  }
  return [...sessions.filter((s) => s !== existing), session]
}

function forget(sessions: TrainingSession[], clientId: string, ctx: SessionContext): TrainingSession[] {
  const gymDate = toGymDate(ctx.now)
  const since = ctx.now - SESSION_UNDO_MINUTES * MINUTE_MS
  return sessions.filter((s) => !(s.clientId === clientId && s.gymDate === gymDate && s.createdAt > since))
}

/** The sessions after a change of the sections from `before` to `after` (every row of `screen_sections`, both times). */
export function applySessionRule(
  sessions: readonly TrainingSession[],
  before: readonly ShownSection[],
  after: readonly ShownSection[],
  ctx: SessionContext,
): TrainingSession[] {
  const oldRows = new Map(before.map((row) => [row.id, row]))
  const newRows = new Map(after.map((row) => [row.id, row]))
  const shownAfter = new Set(after.flatMap((row) => (row.clientId ? [row.clientId] : [])))
  const ids = [...new Set([...oldRows.keys(), ...newRows.keys()])].sort()
  let result = [...sessions]
  for (const id of ids) {
    const old = oldRows.get(id)
    const next = newRows.get(id)
    const oldClient = old?.clientId ?? null
    const newClient = next?.clientId ?? null
    if (next && newClient && (!old || oldClient !== newClient || old.day !== next.day)) result = record(result, newClient, next.day, ctx)
    if (oldClient && oldClient !== newClient && !shownAfter.has(oldClient)) result = forget(result, oldClient, ctx)
  }
  return result
}

interface SlotLike {
  id: string
  /** Epoch ms. */
  startsAt: number
  durationMinutes: number
  status: SlotStatus
}

/** The class a person has a place in at `now`: from FILL_LEAD_MINUTES before it starts until it ends (session_slot). */
export function sessionSlotFor(
  slots: readonly SlotLike[],
  bookings: readonly { slotId: string; clientId: string; status: string }[],
  clientId: string,
  now: number,
): string | null {
  const held = new Set(bookings.filter((b) => b.clientId === clientId && b.status === 'booked').map((b) => b.slotId))
  const current = slots
    .filter(
      (s) =>
        held.has(s.id) &&
        s.status !== 'cancelled' &&
        now >= s.startsAt - FILL_LEAD_MINUTES * MINUTE_MS &&
        now < s.startsAt + s.durationMinutes * MINUTE_MS,
    )
    .sort((a, b) => b.startsAt - a.startsAt)
  return current[0]?.id ?? null
}
