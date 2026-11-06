import { describe, expect, it } from 'vitest'
import { BOOKING_DEFAULTS } from '@shared/booking/constants.ts'
import type { MyBookingRow } from '@shared/booking/memberRpc.ts'
import type { ClassSlotListRow } from '@shared/booking/rpc.ts'
import { canCancel, cancelKind, splitMyBookings, waitlistPositions } from './myBookings'
import { classLine } from './classLine'
import { firstDayWithClasses, slotsOfDay, slotView } from './slotView'

const NOW = Date.parse('2026-11-09T10:00:00Z')
const HOUR = 3_600_000

function slot(overrides: Partial<ClassSlotListRow> = {}): ClassSlotListRow {
  return {
    id: 's1',
    template_id: null,
    starts_at: new Date(NOW + 5 * HOUR).toISOString(),
    gym_date: '2026-11-09',
    duration_minutes: 60,
    capacity: 10,
    name: 'Entrenamiento',
    status: 'open',
    edited: false,
    booked_count: 7,
    waitlist_count: 0,
    my_status: null,
    my_booking_id: null,
    ...overrides,
  }
}

function booking(overrides: Partial<MyBookingRow> = {}): MyBookingRow {
  return {
    booking_id: 'b1',
    slot_id: 's1',
    starts_at: new Date(NOW + 5 * HOUR).toISOString(),
    gym_date: '2026-11-09',
    duration_minutes: 60,
    name: 'Entrenamiento',
    slot_status: 'open',
    status: 'booked',
    waitlist_position: null,
    ...overrides,
  }
}

describe('slotView', () => {
  it('shows the places left and books on tap', () => {
    expect(slotView(slot(), NOW, BOOKING_DEFAULTS)).toEqual({ label: 'Quedan 3 plazas', tone: 'open', action: 'book' })
    expect(slotView(slot({ booked_count: 9 }), NOW, BOOKING_DEFAULTS).label).toBe('Queda 1 plaza')
  })

  it('offers the waitlist of a full class until 30 min before', () => {
    expect(slotView(slot({ booked_count: 10 }), NOW, BOOKING_DEFAULTS)).toMatchObject({ tone: 'waitlist', action: 'waitlist' })
    const soon = slot({ booked_count: 10, starts_at: new Date(NOW + 20 * 60_000).toISOString() })
    expect(slotView(soon, NOW, BOOKING_DEFAULTS)).toMatchObject({ label: 'Completa', action: null })
  })

  it('marks the member’s own classes: a place in green, a waitlist in amber', () => {
    expect(slotView(slot({ my_status: 'booked' }), NOW, BOOKING_DEFAULTS)).toEqual({ label: 'Ya estás apuntado ✓', tone: 'mine', action: null })
    expect(slotView(slot({ my_status: 'waitlisted' }), NOW, BOOKING_DEFAULTS, { waitlistPosition: 2 })).toEqual({
      label: 'En espera · nº 2',
      tone: 'mineWaiting',
      action: null,
    })
  })

  it('offers nothing once the week’s classes are used up, except what the member is already in', () => {
    const usedUp = { quotaUsedUp: true }
    expect(slotView(slot(), NOW, BOOKING_DEFAULTS, usedUp)).toEqual({ label: 'Ya has usado tus clases de la semana', tone: 'muted', action: null })
    expect(slotView(slot({ booked_count: 10 }), NOW, BOOKING_DEFAULTS, usedUp)).toMatchObject({ tone: 'muted', action: null })
    expect(slotView(slot({ my_status: 'booked' }), NOW, BOOKING_DEFAULTS, usedUp).tone).toBe('mine')
    // A class that cannot be booked anyway keeps its own reason.
    expect(slotView(slot({ status: 'closed' }), NOW, BOOKING_DEFAULTS, usedUp).label).toBe('Reservas cerradas')
  })

  it('says why nothing can be done', () => {
    expect(slotView(slot({ status: 'cancelled' }), NOW, BOOKING_DEFAULTS).label).toBe('Cancelada')
    expect(slotView(slot({ status: 'closed' }), NOW, BOOKING_DEFAULTS).label).toBe('Reservas cerradas')
    expect(slotView(slot({ starts_at: new Date(NOW - 10 * 60_000).toISOString() }), NOW, BOOKING_DEFAULTS).label).toBe('Ya ha empezado')
    expect(slotView(slot({ starts_at: new Date(NOW + 20 * 24 * HOUR).toISOString() }), NOW, BOOKING_DEFAULTS).label).toBe(
      'Aún no se puede reservar',
    )
  })

  it('keeps the classes of one day that have not ended, earliest first', () => {
    const late = slot({ id: 'late', starts_at: '2026-11-09T19:00:00Z' })
    const early = slot({ id: 'early', starts_at: '2026-11-09T09:30:00Z' })
    const ended = slot({ id: 'ended', starts_at: '2026-11-09T08:00:00Z' })
    const other = slot({ id: 'other', gym_date: '2026-11-10' })
    expect(slotsOfDay([late, other, ended, early], '2026-11-09', NOW).map((s) => s.id)).toEqual(['early', 'late'])
  })

  it('opens on the first day with a class still to start', () => {
    const days = ['2026-11-09', '2026-11-10', '2026-11-11']
    const startedToday = slot({ starts_at: new Date(NOW - 10 * 60_000).toISOString() })
    const cancelledTomorrow = slot({ id: 'x', gym_date: '2026-11-10', starts_at: '2026-11-10T18:00:00Z', status: 'cancelled' })
    const later = slot({ id: 'y', gym_date: '2026-11-11', starts_at: '2026-11-11T18:00:00Z' })
    expect(firstDayWithClasses([startedToday, cancelledTomorrow, later], days, NOW)).toBe('2026-11-11')
    expect(firstDayWithClasses([slot()], days, NOW)).toBe('2026-11-09')
    expect(firstDayWithClasses([], days, NOW)).toBe('2026-11-09')
  })
})

describe('my bookings', () => {
  it('cancels for free until 2 h before, late after, and leaving a waitlist never counts', () => {
    expect(cancelKind(booking(), NOW, BOOKING_DEFAULTS)).toBe('free')
    const soon = booking({ starts_at: new Date(NOW + HOUR).toISOString() })
    expect(cancelKind(soon, NOW, BOOKING_DEFAULTS)).toBe('late')
    expect(cancelKind(soon, NOW, { ...BOOKING_DEFAULTS, lateCancelCounts: false })).toBe('free')
    expect(cancelKind({ ...soon, status: 'waitlisted' }, NOW, BOOKING_DEFAULTS)).toBe('leave')
  })

  it('cannot cancel once started or a class the gym cancelled', () => {
    expect(canCancel(booking(), NOW)).toBe(true)
    expect(canCancel(booking({ starts_at: new Date(NOW - 60_000).toISOString() }), NOW)).toBe(false)
    expect(canCancel(booking({ status: 'slot_cancelled' }), NOW)).toBe(false)
  })

  it('puts the earliest class first and reads waitlist positions', () => {
    const later = booking({ booking_id: 'later', starts_at: new Date(NOW + 30 * HOUR).toISOString() })
    const waiting = booking({ booking_id: 'w', slot_id: 's9', status: 'waitlisted', waitlist_position: 3 })
    const { next, others } = splitMyBookings([later, booking()])
    expect(next?.booking_id).toBe('b1')
    expect(others.map((b) => b.booking_id)).toEqual(['later'])
    expect(splitMyBookings([]).next).toBeNull()
    expect(waitlistPositions([later, waiting]).get('s9')).toBe(3)
  })

  it('the next class is the first with a place, never a waitlist or a class the gym cancelled', () => {
    const waiting = booking({ booking_id: 'w', status: 'waitlisted', starts_at: new Date(NOW + HOUR).toISOString() })
    const cancelled = booking({ booking_id: 'c', status: 'slot_cancelled', starts_at: new Date(NOW + 2 * HOUR).toISOString() })
    const { next, others } = splitMyBookings([booking(), cancelled, waiting])
    expect(next?.booking_id).toBe('b1')
    expect(others.map((b) => b.booking_id)).toEqual(['w', 'c'])
    expect(splitMyBookings([waiting]).next).toBeNull()
  })

  it('names the class a dialog or a button is about', () => {
    expect(classLine(booking({ starts_at: '2026-11-10T18:00:00Z', gym_date: '2026-11-10' }), '2026-11-09')).toBe('Mañana · 18:00 · Entrenamiento')
  })
})
