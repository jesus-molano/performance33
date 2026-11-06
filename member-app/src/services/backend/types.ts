// What the screens need from the gym: the cloud (Supabase) or the offline demo answer the same way.
// Every method rejects with a UserFacingError whose message can be shown as it is.

import type { BookingSettings } from '@shared/booking/constants.ts'
import type {
  BookClassResult,
  CancelBookingResult,
  MyBookingRow,
  MyMemberRow,
  MyRoutineResult,
  MyWeekUsageRow,
} from '@shared/booking/memberRpc.ts'
import type { ClassSlotListRow } from '@shared/booking/rpc.ts'
import type { GymDate } from '@shared/booking/week.ts'
import type { PublicProgram } from '@shared/routine/types.ts'

export type BackendMode = 'cloud' | 'demo'

export interface MemberBackend {
  mode: BackendMode
  /** Whether a session is saved on this device. */
  hasSession(): Promise<boolean>
  /** Called on every sign-in and sign-out (also from another tab or an expired session). */
  onSessionChange(listener: (signedIn: boolean) => void): () => void
  /** Username or email ('@') plus password. */
  signIn(identifier: string, password: string): Promise<void>
  signOut(): Promise<void>
  /** Replaces the temporary password and tells the gym it was done. */
  changePassword(password: string): Promise<void>

  /** Null without access (no account, paused, archived). */
  myMember(): Promise<MyMemberRow | null>
  bookingSettings(): Promise<BookingSettings>
  myBookings(): Promise<MyBookingRow[]>
  /** The week that holds `day` (today when left out). */
  myWeekUsage(day?: GymDate): Promise<MyWeekUsageRow | null>
  classSlots(from: GymDate, to: GymDate): Promise<ClassSlotListRow[]>
  bookClass(slotId: string): Promise<BookClassResult>
  cancelBooking(bookingId: string): Promise<CancelBookingResult>
  myRoutine(): Promise<MyRoutineResult<PublicProgram>>
  /** Frees their places, deletes the login, then signs out. */
  deleteAccount(): Promise<void>

  /** Live changes of the member's own bookings (a coach moved them, the waitlist gave them a place…). */
  watchMyBookings(clientId: string, onChange: () => void): () => void
}
