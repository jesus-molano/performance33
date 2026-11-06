// A user's account in the members' app, as the coaches' web shows it (the `members` row of schema.sql, camelCase).

export interface MemberAccess {
  clientId: string
  username: string
  /** Null when it signs in with the username only. */
  email: string | null
  /** False = paused by a coach: cannot sign in. */
  active: boolean
  /** Still on the temporary password the coach gave. */
  mustChangePassword: boolean
  /** Epoch ms after which that temporary password no longer works. */
  tempPasswordExpiresAt: number | null
  createdAt: number
}

/** What the coach hands over: shown once, never stored. */
export interface MemberCredentials {
  username: string
  temporaryPassword: string
}

export interface GiveAccessInput {
  /** Null: picked from the user's name. */
  username: string | null
  email: string | null
}

export type MemberAccessStatus = 'pending' | 'expired' | 'active' | 'paused'
