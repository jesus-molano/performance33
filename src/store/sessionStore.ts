// Who is signed in on this window. Written only by auth/session.ts. Never in undo history.

import { create } from 'zustand'
import type { Profile, TeamMember } from '@/types'

export type SessionStatus =
  | 'loading'
  | 'signed-out'
  /** Signed in, but this login has no active account. */
  | 'no-access'
  /** Signed in with a temporary password: must choose their own before anything else. */
  | 'must-change-password'
  /** Signed in, but the access check could not reach the server. */
  | 'offline'
  | 'ready'

interface SessionState {
  status: SessionStatus
  userId: string | null
  /** Email of the signed-in login, with an account or not. */
  email: string | null
  /** The signed-in person's own account. */
  profile: Profile | null
  team: TeamMember[]
  /** Message to show on the login page (e.g. Google refused). */
  notice: string | null
}

export const useSessionStore = create<SessionState>()(() => ({
  status: 'loading',
  userId: null,
  email: null,
  profile: null,
  team: [],
  notice: null,
}))

/** Non-hook accessors (used by store actions to stamp authorship). */
export const getCurrentProfileId = (): string | null => useSessionStore.getState().profile?.id ?? null
export const getTeamIds = (): ReadonlySet<string> => new Set(useSessionStore.getState().team.map((member) => member.id))
