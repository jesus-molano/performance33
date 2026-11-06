import { describe, expect, it } from 'vitest'
import { BOOKING_DEFAULTS } from './constants.ts'
import { isLateCancel, isTooFar, pickFillSlot, slotState, spotsLeft, waitlistOpenAt, type SlotSnapshot } from './slots.ts'

const at = (iso: string) => Date.parse(iso)

// Winter: the gym clock equals UTC, so these read as gym times.
function slot(startsAt: string, extra: Partial<SlotSnapshot> = {}): SlotSnapshot & { id: string } {
  return { id: startsAt, startsAt, durationMinutes: 60, status: 'open', capacity: 10, bookedCount: 0, ...extra }
}

describe('spotsLeft', () => {
  it('never goes below zero with forced bookings', () => {
    expect(spotsLeft({ capacity: 10, bookedCount: 7 })).toBe(3)
    expect(spotsLeft({ capacity: 10, bookedCount: 12 })).toBe(0)
  })
})

describe('booking windows', () => {
  const nine = slot('2026-11-10T09:00:00Z')

  it('a cancellation counts from 2 h before', () => {
    expect(isLateCancel(nine, at('2026-11-10T06:59:00Z'))).toBe(false)
    expect(isLateCancel(nine, at('2026-11-10T07:00:00Z'))).toBe(true)
  })

  it('the waitlist works until 30 min before, and not when it is off', () => {
    expect(waitlistOpenAt(nine, at('2026-11-10T08:29:00Z'))).toBe(true)
    expect(waitlistOpenAt(nine, at('2026-11-10T08:30:00Z'))).toBe(false)
    expect(waitlistOpenAt(nine, at('2026-11-10T06:00:00Z'), { ...BOOKING_DEFAULTS, waitlistEnabled: false })).toBe(false)
  })

  it('classes more than 14 days ahead cannot be booked yet', () => {
    expect(isTooFar(nine, at('2026-10-27T09:00:00Z'))).toBe(false)
    expect(isTooFar(nine, at('2026-10-27T08:59:00Z'))).toBe(true)
  })
})

describe('slotState', () => {
  const now = at('2026-11-10T08:00:00Z')

  it('shows places left, waitlist or full', () => {
    expect(slotState(slot('2026-11-10T10:00:00Z', { bookedCount: 7 }), now)).toBe('open')
    expect(slotState(slot('2026-11-10T10:00:00Z', { bookedCount: 10 }), now)).toBe('waitlist')
    expect(slotState(slot('2026-11-10T08:20:00Z', { bookedCount: 10 }), now)).toBe('full')
  })

  it('cancelled, started and finished come before anything else', () => {
    expect(slotState(slot('2026-11-10T10:00:00Z', { status: 'cancelled' }), now)).toBe('cancelled')
    expect(slotState(slot('2026-11-10T07:30:00Z', { status: 'closed' }), now)).toBe('started')
    expect(slotState(slot('2026-11-10T07:00:00Z'), now)).toBe('finished')
  })

  it('closed bookings and classes too far ahead', () => {
    expect(slotState(slot('2026-11-10T10:00:00Z', { status: 'closed' }), now)).toBe('closed')
    expect(slotState(slot('2026-11-30T10:00:00Z'), now)).toBe('too_far')
  })
})

describe('pickFillSlot', () => {
  const day = [
    slot('2026-11-10T07:00:00Z'),
    slot('2026-11-10T09:00:00Z'),
    slot('2026-11-10T10:00:00Z'),
    slot('2026-11-10T18:00:00Z'),
  ]

  it('takes the class under way', () => {
    expect(pickFillSlot(day, at('2026-11-10T09:20:00Z'))?.id).toBe('2026-11-10T09:00:00Z')
  })

  it('takes a class from 15 min before it starts, even while the previous one ends', () => {
    expect(pickFillSlot(day, at('2026-11-10T08:44:00Z'))?.id).toBe('2026-11-10T09:00:00Z')
    expect(pickFillSlot(day, at('2026-11-10T09:45:00Z'))?.id).toBe('2026-11-10T10:00:00Z')
  })

  it('otherwise takes the next one today, skipping cancelled ones', () => {
    expect(pickFillSlot(day, at('2026-11-10T12:00:00Z'))?.id).toBe('2026-11-10T18:00:00Z')
    const withCancelled = [slot('2026-11-10T13:00:00Z', { status: 'cancelled' }), ...day]
    expect(pickFillSlot(withCancelled, at('2026-11-10T12:50:00Z'))?.id).toBe('2026-11-10T18:00:00Z')
  })

  it('never jumps to tomorrow', () => {
    expect(pickFillSlot(day, at('2026-11-10T20:00:00Z'))).toBeNull()
    expect(pickFillSlot([slot('2026-11-11T07:00:00Z')], at('2026-11-10T20:00:00Z'))).toBeNull()
  })

  it('uses the gym day in summer (UTC+1)', () => {
    // 23:30 UTC on 3 August is 00:30 on 4 August in the gym: tomorrow, seen from 23:00 gym time.
    const afterMidnight = [slot('2026-08-03T23:30:00Z')]
    expect(pickFillSlot(afterMidnight, at('2026-08-03T22:00:00Z'))).toBeNull()
    expect(pickFillSlot(afterMidnight, at('2026-08-03T23:16:00Z'))?.id).toBe('2026-08-03T23:30:00Z')
  })
})
