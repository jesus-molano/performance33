// What a member's app calls in supabase/schema.sql (snake_case, as PostgREST sends it). The person is always the one
// signed in (auth.uid()), never a parameter. Without access (no account, paused, archived, temporary password still in
// place) every function raises 'not_member', except my_member, which answers with no row, and class_slots_for
// ('not_allowed'). `class_slots_for` (rpc.ts) also serves members: from today to `horizon_days`, with `my_status`.

import type { BookingStatus, SlotStatus } from './constants.ts'
import type { Timestamp } from './rpc.ts'
import type { GymDate } from './week.ts'

export const MEMBERS_TABLE = 'members'

export const MEMBER_RPC = {
  myMember: 'my_member',
  finishPasswordChange: 'finish_member_password_change',
  myBookings: 'my_bookings',
  myWeekUsage: 'my_week_usage',
  bookClass: 'book_class',
  cancelBooking: 'cancel_booking',
  deleteMyBookings: 'delete_my_bookings',
  myRoutine: 'my_routine',
} as const

/** The signed-in member's account. Only the first name of the user: never the rest of the user's file. */
export interface MyMemberRow {
  client_id: string
  username: string
  /** Null when the account has no email (it signs in with the username). */
  email: string | null
  first_name: string
  /** Avatar colour (hex), when the user has one. */
  color: string | null
  plan: string
  /** Still on the temporary password the coach gave: change it, then call finish_member_password_change. */
  must_change_password: boolean
  /** That temporary password is over 72 h old: ask the coach for another. */
  temporary_password_expired: boolean
}

/** A row of `members` as the team reads it (the hash is never readable); a member reads only their own. */
export interface MemberRow {
  id: string
  client_id: string
  username: string
  email: string | null
  active: boolean
  must_change_password: boolean
  temp_password_expires_at: Timestamp | null
  created_at: Timestamp
}

export const MEMBER_COLUMNS = 'id,client_id,username,email,active,must_change_password,temp_password_expires_at,created_at'

/** A class of theirs that has not ended: booked, waitlisted, or cancelled by the gym. */
export interface MyBookingRow {
  booking_id: string
  slot_id: string
  starts_at: Timestamp
  gym_date: GymDate
  duration_minutes: number
  name: string
  slot_status: SlotStatus
  status: Extract<BookingStatus, 'booked' | 'waitlisted' | 'slot_cancelled'>
  /** 1 = next to get a place; null unless waitlisted. */
  waitlist_position: number | null
}

export interface MyWeekUsageArgs {
  /** Any day of the week; today when left out. */
  p_week?: GymDate
}

export interface MyWeekUsageRow {
  week_start: GymDate
  used: number
  /** Null = no limit. */
  quota: number | null
}

export interface BookClassArgs {
  p_slot_id: string
}

export interface BookClassResult {
  booking_id: string
  /** Full class: on the waitlist, while it is open. */
  status: 'booked' | 'waitlisted'
  waitlist_position: number | null
}

export interface CancelBookingArgs {
  p_booking_id: string
}

export interface CancelBookingResult {
  booking_id: string
  /** Late = from `cancel_until_minutes` before the class, with a place (never when leaving a waitlist). */
  status: 'cancelled' | 'late_cancelled'
  /** It still counts in the week (late, and the rules say so). */
  counts: boolean
  promoted: number
}

/** A session as `training_sessions` stores it: `sessionFromRow` (shared/routine) reads it. */
export interface MyRoutineSession {
  client_id: string
  gym_date: GymDate
  program_id: string
  day_id: string | null
  day_number: number
  slot_id: string | null
  created_at: Timestamp
}

export interface MyRoutineResult<Program = unknown> {
  /** The current routine, with exactly the fields of toPublicProgram; null without one. */
  program: Program | null
  /** The last 60 days, newest first. */
  sessions: MyRoutineSession[]
}

type NoArgs = Record<string, never>

export interface MemberRpcs {
  my_member: { args: NoArgs; result: MyMemberRow[] }
  finish_member_password_change: { args: NoArgs; result: null }
  my_bookings: { args: NoArgs; result: MyBookingRow[] }
  my_week_usage: { args: MyWeekUsageArgs; result: MyWeekUsageRow[] }
  book_class: { args: BookClassArgs; result: BookClassResult[] }
  cancel_booking: { args: CancelBookingArgs; result: CancelBookingResult[] }
  /** How many places and waitlist turns were freed. */
  delete_my_bookings: { args: NoArgs; result: number }
  my_routine: { args: NoArgs; result: MyRoutineResult }
}
