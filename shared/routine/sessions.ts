// Training sessions: which day of their routine each person did on each gym date (supabase/schema.sql,
// `training_sessions`, written only by the `record_training_session` trigger of the TV sections).

import type { GymDate } from '../booking/week.ts'

export const SESSION_TABLE = 'training_sessions'

/** Taking someone off every screen this soon after they were first put on one that day means it was a mistake. */
export const SESSION_UNDO_MINUTES = 10

/** How far back the web reads sessions: plenty to know the last one of everybody. */
export const SESSION_READ_DAYS = 60

export interface TrainingSession {
  clientId: string
  gymDate: GymDate
  /** The routine that was current then (it may have been removed since). */
  programId: string
  /** Id of the day done; null if that routine had no id there. */
  dayId: string | null
  /** 1-based position of that day in the routine then. */
  dayNumber: number
  /** The class the person had a place in at the time, if any. */
  slotId: string | null
  /** Epoch ms of the first time that day. */
  createdAt: number
}

/** A row as PostgREST sends it. */
export interface TrainingSessionRow {
  client_id: string
  gym_date: GymDate
  program_id: string
  day_id: string | null
  day_number: number
  slot_id: string | null
  created_at: string
}

export const SESSION_COLUMNS = 'client_id,gym_date,program_id,day_id,day_number,slot_id,created_at'

export function sessionFromRow(row: TrainingSessionRow): TrainingSession {
  return {
    clientId: row.client_id,
    gymDate: row.gym_date,
    programId: row.program_id,
    dayId: row.day_id,
    dayNumber: row.day_number,
    slotId: row.slot_id,
    createdAt: Date.parse(row.created_at),
  }
}

/** The most recent session of each person (latest gym date). */
export function latestSessions(sessions: readonly TrainingSession[]): Map<string, TrainingSession> {
  const latest = new Map<string, TrainingSession>()
  for (const session of sessions) {
    const current = latest.get(session.clientId)
    if (!current || session.gymDate > current.gymDate) latest.set(session.clientId, session)
  }
  return latest
}
