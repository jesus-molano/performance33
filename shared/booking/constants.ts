// Booking rules shared by the coaches' web, the members' app and the SQL defaults in schema.sql.
// Pure TS: no React, no DOM, no Node, no dependencies (it also runs on Hermes).

/** The gym's time zone: weeks, "today" and class times are always read here, never in the device's zone. */
export const GYM_TIME_ZONE = 'Atlantic/Canary'

/** Same ids as the web's `PlanId`. */
export const BOOKING_PLAN_IDS = ['standard', 'plus', 'elite', 'custom'] as const
export type BookingPlanId = (typeof BOOKING_PLAN_IDS)[number]

/** Classes a plan may book per week: a number, no limit, or the client's own training days. */
export type QuotaRule = number | 'unlimited' | 'training_days'

export interface BookingSettings {
  weeklyQuota: Record<BookingPlanId, QuotaRule>
  /** How many days ahead a class can be booked. */
  horizonDays: number
  /** Cancelling up to this many minutes before the class does not count in the week. */
  cancelUntilMinutes: number
  /** A cancellation after that still counts in the week. */
  lateCancelCounts: boolean
  waitlistEnabled: boolean
  /** The waitlist moves people in until this many minutes before the class. */
  promoteUntilMinutes: number
}

export const BOOKING_DEFAULTS: BookingSettings = {
  weeklyQuota: { standard: 2, plus: 3, elite: 'unlimited', custom: 'training_days' },
  horizonDays: 14,
  cancelUntilMinutes: 120,
  lateCancelCounts: true,
  waitlistEnabled: true,
  promoteUntilMinutes: 30,
}

/** Bounds for the settings editor and the SQL checks. */
export const BOOKING_LIMITS = {
  weeklyQuota: { min: 1, max: 7 },
  horizonDays: { min: 1, max: 60 },
  cancelUntilMinutes: { min: 0, max: 2880 },
  promoteUntilMinutes: { min: 0, max: 1440 },
  capacity: { min: 1, max: 100 },
  durationMinutes: { min: 15, max: 240 },
} as const

/** "Rellenar con la siguiente clase" picks a class from this many minutes before it starts. */
export const FILL_LEAD_MINUTES = 15

export const BOOKING_STATUSES = ['booked', 'waitlisted', 'cancelled', 'late_cancelled', 'removed', 'slot_cancelled'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

/** Holds a place in the class or in its waitlist (one per person and class). */
export const ACTIVE_BOOKING_STATUSES = ['booked', 'waitlisted'] as const satisfies readonly BookingStatus[]

export const SLOT_STATUSES = ['open', 'closed', 'cancelled'] as const
export type SlotStatus = (typeof SLOT_STATUSES)[number]

export const MINUTE_MS = 60_000
export const DAY_MS = 86_400_000
