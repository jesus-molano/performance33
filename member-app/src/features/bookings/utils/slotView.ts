// How a class reads in "Reservar" for this member, and what tapping it does (pure).

import type { BookingSettings } from '@shared/booking/constants.ts'
import type { ClassSlotListRow } from '@shared/booking/rpc.ts'
import { slotEndMs, slotStartMs, slotState, spotsLeft, type SlotSnapshot } from '@shared/booking/slots.ts'
import { toMs, type GymDate, type Instant } from '@shared/booking/week.ts'
import { COPY } from '@/config/copy'

/** `mine`: has a place; `mineWaiting`: on its waitlist; `open`: places left; `waitlist`: full, the waitlist takes people; `muted`: nothing to do. */
export type SlotTone = 'mine' | 'mineWaiting' | 'open' | 'waitlist' | 'muted'

export interface SlotView {
  label: string
  tone: SlotTone
  /** What a tap does: book a place, join the waitlist, or nothing. */
  action: 'book' | 'waitlist' | null
}

export interface SlotViewContext {
  /** From my_bookings, when the member is waiting for this class. */
  waitlistPosition?: number | null
  /** No classes left in that class's week: booking and the waitlist would both be refused. */
  quotaUsedUp?: boolean
}

export function toSlotSnapshot(row: ClassSlotListRow): SlotSnapshot {
  return {
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    status: row.status,
    capacity: row.capacity,
    bookedCount: row.booked_count,
  }
}

const MUTED_LABELS = {
  cancelled: COPY.book.cancelled,
  finished: COPY.book.finished,
  started: COPY.book.started,
  closed: COPY.book.closed,
  too_far: COPY.book.tooFar,
  full: COPY.book.full,
} as const

export function slotView(row: ClassSlotListRow, now: Instant, settings: BookingSettings, context: SlotViewContext = {}): SlotView {
  if (row.my_status === 'booked') return { label: COPY.book.booked, tone: 'mine', action: null }
  if (row.my_status === 'waitlisted') {
    return { label: COPY.book.waitlisted(context.waitlistPosition ?? null), tone: 'mineWaiting', action: null }
  }
  const snapshot = toSlotSnapshot(row)
  const state = slotState(snapshot, now, settings)
  if ((state === 'open' || state === 'waitlist') && context.quotaUsedUp) return { label: COPY.book.quotaUsedUp, tone: 'muted', action: null }
  if (state === 'open') return { label: COPY.book.spotsLeft(spotsLeft(snapshot)), tone: 'open', action: 'book' }
  if (state === 'waitlist') return { label: COPY.book.waitlist, tone: 'waitlist', action: 'waitlist' }
  return { label: MUTED_LABELS[state], tone: 'muted', action: null }
}

const timing = (row: ClassSlotListRow) => ({ startsAt: row.starts_at, durationMinutes: row.duration_minutes })

/** The classes of one gym day that have not ended (ended ones are no use to a member), earliest first. */
export function slotsOfDay(rows: readonly ClassSlotListRow[], date: GymDate, now: Instant): ClassSlotListRow[] {
  return rows
    .filter((row) => row.gym_date === date && slotEndMs(timing(row)) > toMs(now))
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
}

/** Where "Reservar" opens: the first of `days` with a class still to start (not cancelled), else the first day. */
export function firstDayWithClasses(rows: readonly ClassSlotListRow[], days: readonly GymDate[], now: Instant): GymDate | undefined {
  const ahead = (row: ClassSlotListRow) => row.status !== 'cancelled' && slotStartMs(timing(row)) > toMs(now)
  return days.find((day) => rows.some((row) => row.gym_date === day && ahead(row))) ?? days[0]
}
