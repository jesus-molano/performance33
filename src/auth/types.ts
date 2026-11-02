// Contracts of the login and the team, implemented for the cloud and for local test mode.

import type { OwnProfilePatch, Profile, ProfileRole, TeamMember } from '@/types'

export interface AuthUser {
  id: string
  email: string | null
}

export type AuthEvent = { type: 'signed-in'; user: AuthUser } | { type: 'signed-out' }

export interface SignInMethods {
  google: boolean
  /** Never true when Google is the only way in that this person knows. */
  canDisconnectGoogle: boolean
}

export interface AuthService {
  readonly isLocal: boolean
  /** null = nobody is signed in. Rejects when it could not be checked (no connection): that is not a sign-out. */
  getUser(): Promise<AuthUser | null>
  /** Also fires when another window of this browser signs in or out. */
  onChange(listener: (event: AuthEvent) => void): () => void
  /** Email or username (it has an '@' or it does not). This and all below reject with a Spanish message. */
  signIn(identifier: string, password: string): Promise<void>
  signInWithGoogle(): Promise<void>
  /** Rejects with SamePasswordError when it is the password already in place. */
  changePassword(password: string): Promise<void>
  /** Whether this is the signed-in person's password. It touches nothing of the session in use. */
  verifyPassword(password: string): Promise<boolean>
  getSignInMethods(hasOwnPassword: boolean): Promise<SignInMethods>
  /** Leaves for Google and comes back to this site. */
  connectGoogle(): Promise<void>
  disconnectGoogle(): Promise<void>
  /** Signs out on this device only. Always leaves this device signed out, even without connection. */
  signOut(): Promise<void>
}

export interface NewAccountInput {
  name: string
  username: string
  email: string | null
  role: ProfileRole
  color: string
}

export interface TeamService {
  /** The signed-in person's account. null = no access. Rejects without connection. */
  getOwnProfile(): Promise<Profile | null>
  /** What everyone can see of everyone (note signatures). */
  list(): Promise<TeamMember[]>
  /** The methods below reject with a Spanish message. */
  updateOwnProfile(id: string, patch: OwnProfilePatch): Promise<void>
  /** Ends the first-login step; refused while the password is still the temporary one. */
  finishPasswordChange(): Promise<void>
  /** Someone changed the team. */
  subscribe(listener: () => void): () => void

  // Administrators only (Ajustes → Equipo). The server checks it.
  listAccounts(): Promise<Profile[]>
  /** Returns the temporary password: this is the only time anyone can see it. */
  createAccount(input: NewAccountInput): Promise<string>
  /** Returns the new temporary password and closes that person's sessions. */
  resetPassword(id: string): Promise<string>
  setRole(id: string, role: ProfileRole): Promise<void>
  setActive(id: string, active: boolean): Promise<void>
  deleteAccount(id: string): Promise<void>
}
