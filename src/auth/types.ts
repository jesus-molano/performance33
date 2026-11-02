// Contracts of the login and the team list, implemented for the cloud and for local test mode.

import type { NewStaffInput, StaffAccessPatch, StaffMember, StaffProfilePatch, StaffRole } from '@/types'

export interface AuthUser {
  id: string
}

export type AuthEvent =
  | { type: 'signed-in'; user: AuthUser }
  | { type: 'signed-out' }
  /** Arrived through a password-reset link. */
  | { type: 'recovery'; user: AuthUser }

export interface AuthService {
  readonly isLocal: boolean
  getUser(): Promise<AuthUser | null>
  /** Also fires when another window of this browser signs in or out. */
  onChange(listener: (event: AuthEvent) => void): () => void
  /** All of these reject with a Spanish message. */
  signInWithPassword(email: string, password: string): Promise<void>
  signInWithGoogle(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  updatePassword(password: string): Promise<void>
  /** Signs out on this device only. Always leaves this device signed out, even without connection. */
  signOut(): Promise<void>
  /** Exists ONLY in local test mode: sign in as a demo person, without a password. */
  readonly demoSignIn?: (role: StaffRole) => Promise<void>
}

export interface TeamService {
  /** Links the account to its staff row on first sign-in. null = not on the active list. Rejects without connection. */
  claimProfile(): Promise<StaffMember | null>
  list(): Promise<StaffMember[]>
  /** The methods below reject with a Spanish message. */
  add(input: NewStaffInput, color: string): Promise<void>
  updateAccess(id: string, patch: StaffAccessPatch): Promise<void>
  updateOwnProfile(id: string, patch: StaffProfilePatch): Promise<void>
  /** Someone changed the team list. */
  subscribe(listener: () => void): () => void
}
