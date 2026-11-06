import { describe, expect, it } from 'vitest'
import { upcomingFrom, type CloudUpcomingRow } from './cloudUpcoming'

const slot = (id: string, startsAt: string) => ({
  id, template_id: null, starts_at: startsAt, gym_date: startsAt.slice(0, 10), duration_minutes: 60, capacity: 8, name: 'Entrenamiento',
  status: 'open' as const, edited: false,
})

const row = (id: string, slotId: string, startsAt: string, status: 'booked' | 'waitlisted', queue: number): CloudUpcomingRow => ({
  id, slot_id: slotId, client_id: 'c1', status, forced: false, queue_order: queue, class_slots: slot(slotId, startsAt),
})

describe('upcomingFrom', () => {
  it('keeps classes not ended yet, soonest first, with the waitlist place', () => {
    const now = Date.parse('2026-11-06T10:30:00Z')
    const upcoming = upcomingFrom(
      [
        row('b3', 's3', '2026-11-09T07:00:00+00:00', 'waitlisted', 30),
        row('b1', 's1', '2026-11-06T10:00:00+00:00', 'booked', 10),
        row('b0', 's0', '2026-11-06T08:00:00+00:00', 'booked', 5),
      ],
      [
        { slot_id: 's3', queue_order: 12 },
        { slot_id: 's3', queue_order: 30 },
        { slot_id: 's9', queue_order: 1 },
      ],
      now,
    )
    expect(upcoming.map((u) => [u.bookingId, u.waitlistPosition])).toEqual([
      ['b1', null],
      ['b3', 2],
    ])
  })
})
