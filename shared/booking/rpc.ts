// The booking tables and functions of supabase/schema.sql as the web and the app receive them (snake_case,
// as PostgREST sends them). A function that `returns table` always comes back as an array of rows.

import {
  BOOKING_PLAN_IDS,
  type BookingPlanId,
  type BookingSettings,
  type BookingStatus,
  type QuotaRule,
  type SlotStatus,
} from './constants.ts'
import type { GymDate } from './week.ts'

/** A timestamptz as PostgREST sends it: ISO with offset. */
export type Timestamp = string
/** A time of day as Postgres sends it: 'HH:MM:SS'. */
export type TimeOfDay = string

export const BOOKING_TABLES = {
  settings: 'booking_settings',
  templates: 'class_templates',
  slots: 'class_slots',
  bookings: 'bookings',
} as const

export const BOOKING_RPC = {
  classSlotsFor: 'class_slots_for',
  staffAddBooking: 'staff_add_booking',
  staffRemoveBooking: 'staff_remove_booking',
  staffMoveBooking: 'staff_move_booking',
  staffUpdateSlot: 'staff_update_slot',
  staffCreateSlot: 'staff_create_slot',
  staffWeekUsage: 'staff_week_usage',
} as const

// ── Rows (staff read them directly; nobody writes bookings or class_slots but the functions) ──

/** How a plan's weekly classes are stored: `fixed` uses the number next to it. */
export type QuotaRuleKind = 'fixed' | 'unlimited' | 'training_days'

export interface BookingSettingsValues {
  quota_standard_rule: QuotaRuleKind
  quota_standard: number | null
  quota_plus_rule: QuotaRuleKind
  quota_plus: number | null
  quota_elite_rule: QuotaRuleKind
  quota_elite: number | null
  quota_custom_rule: QuotaRuleKind
  quota_custom: number | null
  horizon_days: number
  cancel_until_minutes: number
  late_cancel_counts: boolean
  waitlist_enabled: boolean
  promote_until_minutes: number
}

/** The single row 'main'. Staff read it; only an admin updates it. */
export interface BookingSettingsRow extends BookingSettingsValues {
  id: 'main'
  updated_at: Timestamp
  updated_by: string | null
}

/** The weekly timetable. Staff read it; only an admin inserts, updates or deletes. */
export interface ClassTemplateRow {
  id: string
  /** 1 = Monday … 7 = Sunday. */
  weekday: number
  start_time: TimeOfDay
  duration_minutes: number
  capacity: number
  name: string
  active: boolean
  created_at: Timestamp
  updated_at: Timestamp
  updated_by: string | null
}

export type ClassTemplateInput = Pick<ClassTemplateRow, 'weekday' | 'start_time' | 'duration_minutes' | 'capacity' | 'name' | 'active'>

export interface ClassSlotRow {
  id: string
  /** Null for a class added by hand, or once its timetable entry is deleted. */
  template_id: string | null
  /** The day the timetable made it for (it stays even if a coach moves the class). */
  template_date: GymDate | null
  starts_at: Timestamp
  /** The gym day it starts on, from `starts_at`. */
  gym_date: GymDate
  duration_minutes: number
  capacity: number
  name: string
  status: SlotStatus
  /** A coach changed it: timetable edits no longer touch it. */
  edited: boolean
  created_at: Timestamp
  updated_at: Timestamp
  updated_by: string | null
}

export interface BookingRow {
  id: string
  slot_id: string
  client_id: string
  status: BookingStatus
  /** Added by a coach over the capacity. */
  forced: boolean
  /** The coach who added it; null if the member booked. */
  added_by: string | null
  /** After a move: the booking in the other class. */
  moved_to: string | null
  /** Order of arrival: the waitlist goes by it, lowest first. */
  queue_order: number
  created_at: Timestamp
  status_changed_at: Timestamp
  updated_at: Timestamp
  updated_by: string | null
}

// ── Functions ──

export interface ClassSlotsForArgs {
  p_from: GymDate
  /** Inclusive; at most SLOT_LIST_MAX_DAYS from `p_from`. */
  p_to: GymDate
}

export interface ClassSlotListRow
  extends Pick<ClassSlotRow, 'id' | 'template_id' | 'starts_at' | 'gym_date' | 'duration_minutes' | 'capacity' | 'name' | 'status' | 'edited'> {
  /** People with a place, forced ones included. */
  booked_count: number
  waitlist_count: number
  /** The member's own booking, with a place or waitlisted; always null for staff. */
  my_status: Extract<BookingStatus, 'booked' | 'waitlisted'> | null
  my_booking_id: string | null
}

export interface StaffAddBookingArgs {
  p_slot_id: string
  p_client_id: string
  /** Add over the capacity instead of refusing with `slot_full`. */
  p_force?: boolean
}

export interface StaffBookingResult {
  booking_id: string
  status: 'booked'
  forced: boolean
  /** The person already had their classes of that week: added anyway, only a warning. */
  over_quota: boolean
}

export interface StaffRemoveBookingArgs {
  p_booking_id: string
}

export interface StaffRemoveBookingResult {
  booking_id: string
  slot_id: string
  client_id: string
  previous_status: 'booked' | 'waitlisted'
  /** People moved in from the waitlist. */
  promoted: number
}

export interface StaffMoveBookingArgs {
  p_booking_id: string
  p_to_slot_id: string
  p_force?: boolean
}

export interface StaffMoveBookingResult extends StaffBookingResult {
  /** Moved in from the waitlist of the class left. */
  promoted: number
}

/** Leave a field out (or null) to keep it. */
export interface StaffUpdateSlotArgs {
  p_slot_id: string
  p_name?: string | null
  p_starts_at?: Timestamp | null
  p_duration_minutes?: number | null
  p_capacity?: number | null
  /** 'cancelled' cancels every booking and cannot be undone. */
  p_status?: SlotStatus | null
}

export interface StaffUpdateSlotResult {
  slot_id: string
  status: SlotStatus
  capacity: number
  promoted: number
  /** Members told about a cancellation or a new time. */
  notified: number
}

export interface StaffCreateSlotArgs {
  p_starts_at: Timestamp
  p_duration_minutes: number
  p_capacity: number
  p_name: string
}

export interface StaffWeekUsageArgs {
  p_client_id: string
  /** Any day of the week. */
  p_week: GymDate
}

export interface StaffWeekUsageResult {
  week_start: GymDate
  used: number
  /** Null = no limit. */
  quota: number | null
}

/** Arguments and result of each booking function, for a typed `rpc` wrapper. */
export interface BookingRpcs {
  class_slots_for: { args: ClassSlotsForArgs; result: ClassSlotListRow[] }
  staff_add_booking: { args: StaffAddBookingArgs; result: StaffBookingResult[] }
  staff_remove_booking: { args: StaffRemoveBookingArgs; result: StaffRemoveBookingResult[] }
  staff_move_booking: { args: StaffMoveBookingArgs; result: StaffMoveBookingResult[] }
  staff_update_slot: { args: StaffUpdateSlotArgs; result: StaffUpdateSlotResult[] }
  /** The new class id. */
  staff_create_slot: { args: StaffCreateSlotArgs; result: string }
  staff_week_usage: { args: StaffWeekUsageArgs; result: StaffWeekUsageResult[] }
}

// ── Settings row ⇄ BookingSettings ──

function ruleFromColumns(kind: QuotaRuleKind, classes: number | null): QuotaRule {
  if (kind === 'fixed' && classes !== null) return classes
  return kind === 'training_days' ? 'training_days' : 'unlimited'
}

function ruleToColumns(rule: QuotaRule): [QuotaRuleKind, number | null] {
  return typeof rule === 'number' ? ['fixed', rule] : [rule, null]
}

export function bookingSettingsFromRow(row: BookingSettingsValues): BookingSettings {
  const quota = (plan: BookingPlanId) => ruleFromColumns(row[`quota_${plan}_rule` as const], row[`quota_${plan}` as const])
  return {
    weeklyQuota: Object.fromEntries(BOOKING_PLAN_IDS.map((plan) => [plan, quota(plan)])) as Record<BookingPlanId, QuotaRule>,
    horizonDays: row.horizon_days,
    cancelUntilMinutes: row.cancel_until_minutes,
    lateCancelCounts: row.late_cancel_counts,
    waitlistEnabled: row.waitlist_enabled,
    promoteUntilMinutes: row.promote_until_minutes,
  }
}

export function bookingSettingsToRow(settings: BookingSettings): BookingSettingsValues {
  const [standardRule, standard] = ruleToColumns(settings.weeklyQuota.standard)
  const [plusRule, plus] = ruleToColumns(settings.weeklyQuota.plus)
  const [eliteRule, elite] = ruleToColumns(settings.weeklyQuota.elite)
  const [customRule, custom] = ruleToColumns(settings.weeklyQuota.custom)
  return {
    quota_standard_rule: standardRule,
    quota_standard: standard,
    quota_plus_rule: plusRule,
    quota_plus: plus,
    quota_elite_rule: eliteRule,
    quota_elite: elite,
    quota_custom_rule: customRule,
    quota_custom: custom,
    horizon_days: settings.horizonDays,
    cancel_until_minutes: settings.cancelUntilMinutes,
    late_cancel_counts: settings.lateCancelCounts,
    waitlist_enabled: settings.waitlistEnabled,
    promote_until_minutes: settings.promoteUntilMinutes,
  }
}
