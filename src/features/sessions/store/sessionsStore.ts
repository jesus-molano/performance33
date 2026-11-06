// What this window knows of the training sessions (the last SESSION_READ_DAYS days). A store of its own, outside the
// routine data: never in undo, never in backups.

import { create } from 'zustand'
import { latestSessions, type TrainingSession } from '@shared/routine'

export interface SessionsState {
  status: 'loading' | 'ready' | 'error'
  /** A read has worked at least once: until then nobody's next day is known (not even Día 1). */
  known: boolean
  /** The latest session of each person. */
  latest: ReadonlyMap<string, TrainingSession>
}

const initialState = (): SessionsState => ({ status: 'loading', known: false, latest: new Map() })

export const useSessionsStore = create<SessionsState>()(initialState)

export function setSessions(sessions: readonly TrainingSession[]): void {
  useSessionsStore.setState({ status: 'ready', known: true, latest: latestSessions(sessions) })
}

/** A failed read keeps what was known. */
export function markSessionsFailed(): void {
  useSessionsStore.setState({ status: 'error' })
}

export function resetSessionsState(): void {
  useSessionsStore.setState(initialState())
}
