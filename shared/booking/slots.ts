// What a class looks like right now (open, full, waitlist…) and which one "Rellenar" should use.

import {
  BOOKING_DEFAULTS,
  DAY_MS,
  FILL_LEAD_MINUTES,
  MINUTE_MS,
  type BookingSettings,
  type SlotStatus,
} from './constants.ts'
import { toGymDate, toMs, type Instant } from './week.ts'

export interface SlotTiming {
  startsAt: Instant
  durationMinutes: number
}

export interface SlotSnapshot extends SlotTiming {
  status: SlotStatus
  capacity: number
  /** People with a place (forced ones included), not the waitlist. */
  bookedCount: number
}

/**
 * What a member sees for a class, in priority order: cancelled, already over, already started,
 * bookings closed, too far ahead, places left, full with waitlist, full.
 */
export type SlotState = 'cancelled' | 'finished' | 'started' | 'closed' | 'too_far' | 'open' | 'waitlist' | 'full'

type SlotRules = Pick<BookingSettings, 'horizonDays' | 'waitlistEnabled' | 'promoteUntilMinutes' | 'cancelUntilMinutes'>

export function slotStartMs(slot: SlotTiming): number {
  return toMs(slot.startsAt)
}

export function slotEndMs(slot: SlotTiming): number {
  return slotStartMs(slot) + slot.durationMinutes * MINUTE_MS
}

/** Free places; never negative (forced bookings can go over the capacity). */
export function spotsLeft(slot: Pick<SlotSnapshot, 'capacity' | 'bookedCount'>): number {
  return Math.max(0, slot.capacity - slot.bookedCount)
}

/** The waitlist still takes people and moves them in (until `promoteUntilMinutes` before the class). */
export function waitlistOpenAt(slot: SlotTiming, now: Instant, rules: SlotRules = BOOKING_DEFAULTS): boolean {
  return rules.waitlistEnabled && toMs(now) < slotStartMs(slot) - rules.promoteUntilMinutes * MINUTE_MS
}

/** Cancelling now still counts in the week (from `cancelUntilMinutes` before the class). */
export function isLateCancel(slot: SlotTiming, now: Instant, rules: SlotRules = BOOKING_DEFAULTS): boolean {
  return toMs(now) >= slotStartMs(slot) - rules.cancelUntilMinutes * MINUTE_MS
}

/** Further ahead than members may book. */
export function isTooFar(slot: SlotTiming, now: Instant, rules: SlotRules = BOOKING_DEFAULTS): boolean {
  return slotStartMs(slot) > toMs(now) + rules.horizonDays * DAY_MS
}

export function slotState(slot: SlotSnapshot, now: Instant, rules: SlotRules = BOOKING_DEFAULTS): SlotState {
  const nowMs = toMs(now)
  if (slot.status === 'cancelled') return 'cancelled'
  if (nowMs >= slotEndMs(slot)) return 'finished'
  if (nowMs >= slotStartMs(slot)) return 'started'
  if (slot.status === 'closed') return 'closed'
  if (isTooFar(slot, nowMs, rules)) return 'too_far'
  if (spotsLeft(slot) > 0) return 'open'
  return waitlistOpenAt(slot, nowMs, rules) ? 'waitlist' : 'full'
}

/**
 * The class "Rellenar con la siguiente clase" uses: the one under way (from `leadMinutes` before it starts;
 * if several, the latest to start), otherwise the next one later today in the gym. Cancelled ones never count.
 */
export function pickFillSlot<T extends SlotTiming & { status: SlotStatus }>(
  slots: readonly T[],
  now: Instant,
  leadMinutes: number = FILL_LEAD_MINUTES,
): T | null {
  const nowMs = toMs(now)
  const today = toGymDate(nowMs)
  const live = slots.filter((slot) => slot.status !== 'cancelled')
  const byStart = (a: T, b: T) => slotStartMs(a) - slotStartMs(b)

  const underWay = live
    .filter((slot) => nowMs >= slotStartMs(slot) - leadMinutes * MINUTE_MS && nowMs < slotEndMs(slot))
    .sort(byStart)
  if (underWay.length > 0) return underWay[underWay.length - 1]

  const laterToday = live
    .filter((slot) => slotStartMs(slot) > nowMs && toGymDate(slotStartMs(slot)) === today)
    .sort(byStart)
  return laterToday[0] ?? null
}
