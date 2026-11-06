// The member's own classes: which one is next, and what cancelling one means (pure).

import type { BookingSettings } from '@shared/booking/constants.ts'
import type { MyBookingRow } from '@shared/booking/memberRpc.ts'
import { isLateCancel } from '@shared/booking/slots.ts'
import { toMs, type Instant } from '@shared/booking/week.ts'

/** `leave`: off a waitlist (never counts); `free`: in time, does not count; `late`: counts in the week. */
export type CancelKind = 'leave' | 'free' | 'late'

const timing = (booking: MyBookingRow) => ({ startsAt: booking.starts_at, durationMinutes: booking.duration_minutes })

export function cancelKind(booking: MyBookingRow, now: Instant, settings: BookingSettings): CancelKind {
  if (booking.status === 'waitlisted') return 'leave'
  return settings.lateCancelCounts && isLateCancel(timing(booking), now, settings) ? 'late' : 'free'
}

/** Only until the class starts, and never one the gym cancelled. */
export function canCancel(booking: MyBookingRow, now: Instant): boolean {
  return booking.status !== 'slot_cancelled' && toMs(now) < toMs(booking.starts_at)
}

/** The earliest class with a held place is shown big ("Tu próxima clase"); waitlists and cancelled ones never are. */
export function splitMyBookings(rows: readonly MyBookingRow[]): { next: MyBookingRow | null; others: MyBookingRow[] } {
  const sorted = [...rows].sort((a, b) => toMs(a.starts_at) - toMs(b.starts_at))
  const next = sorted.find((row) => row.status === 'booked') ?? null
  return { next, others: sorted.filter((row) => row !== next) }
}

/** Waitlist position of each class the member is waiting for, by class id. */
export function waitlistPositions(rows: readonly MyBookingRow[]): Map<string, number | null> {
  return new Map(rows.filter((row) => row.status === 'waitlisted').map((row) => [row.slot_id, row.waitlist_position]))
}
