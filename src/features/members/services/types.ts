// The members' app accounts as the coaches' web looks after them: the member-accounts function and the `members`
// table in the cloud, this browser in local test mode. Same rules in both; every method rejects with a Spanish message.

import type { GiveAccessInput, MemberAccess, MemberCredentials } from '@/features/members/types'

export interface MemberAccessService {
  /** That user's account, or null when they have no access to the app. */
  load(clientId: string): Promise<MemberAccess | null>
  /** Any coach. Returns the username and the temporary password: the only time anyone sees it. */
  give(clientId: string, input: GiveAccessInput): Promise<MemberCredentials>
  /** A new temporary password; the member's sessions end. */
  resetPassword(clientId: string): Promise<MemberCredentials>
  /** Paused: cannot sign in (bookings stay). */
  setActive(clientId: string, active: boolean): Promise<void>
  /** Deletes the account and its login; the user's file and bookings stay. */
  remove(clientId: string): Promise<void>
  /** Some account changed (here or on another device). */
  subscribe(listener: () => void): () => void
}
