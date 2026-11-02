// Who is signed in on this window. Written only by auth/session.ts. Never in undo history.

import { create } from 'zustand'
import type { StaffMember } from '@/types'

export type SessionStatus =
  | 'loading'
  | 'signed-out'
  /** Signed in, but the email is not on the active staff list. */
  | 'no-access'
  /** Came from a password-reset link: must choose a new password. */
  | 'recovery'
  /** Signed in, but the access check could not reach the server. */
  | 'offline'
  | 'ready'

interface SessionState {
  status: SessionStatus
  userId: string | null
  /** Email of the signed-in account, on the list or not. */
  email: string | null
  /** The signed-in coach once the status is 'ready'. */
  staff: StaffMember | null
  team: StaffMember[]
  /** Message to show on the login page (e.g. an expired link). */
  notice: string | null
}

export const useSessionStore = create<SessionState>()(() => ({
  status: 'loading',
  userId: null,
  email: null,
  staff: null,
  team: [],
  notice: null,
}))

/** Non-hook accessors (used by store actions to stamp authorship). */
export const getCurrentStaffId = (): string | null => useSessionStore.getState().staff?.id ?? null
export const getTeamIds = (): ReadonlySet<string> => new Set(useSessionStore.getState().team.map((member) => member.id))
