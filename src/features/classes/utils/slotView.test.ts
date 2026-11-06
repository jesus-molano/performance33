import { describe, expect, it } from 'vitest'
import type { Booking, SlotSummary } from '@/features/classes/types'
import { buildRoster, canManageSlot, moveTargets, peopleInSlot, slotBadge, slotCounts, staffSlotState, type RosterClient } from './slotView'

const START = Date.UTC(2026, 10, 6, 18)
const HOUR = 3_600_000

const slot = (patch: Partial<SlotSummary> = {}): SlotSummary => ({
  id: 's1', templateId: 't1', startsAt: START, gymDate: '2026-11-06', durationMinutes: 60, capacity: 10, name: 'Entrenamiento',
  status: 'open', edited: false, bookedCount: 3, waitlistCount: 0, ...patch,
})

const booking = (id: string, patch: Partial<Booking> = {}): Booking => ({
  id, slotId: 's1', clientId: id.replace('b', 'c'), status: 'booked', forced: false, queueOrder: 1, ...patch,
})

describe('staff view of a class', () => {
  it('goes cancelled, finished, started, closed, full, open in that order', () => {
    const before = START - HOUR
    expect(staffSlotState(slot({ status: 'cancelled' }), START + 2 * HOUR)).toBe('cancelled')
    expect(staffSlotState(slot({ status: 'closed' }), START + HOUR)).toBe('finished')
    expect(staffSlotState(slot({ status: 'closed' }), START)).toBe('started')
    expect(staffSlotState(slot({ status: 'closed' }), before)).toBe('closed')
    expect(staffSlotState(slot({ bookedCount: 10 }), before)).toBe('full')
    expect(staffSlotState(slot({ bookedCount: 11 }), before)).toBe('full')
    expect(staffSlotState(slot(), before)).toBe('open')
  })

  it('gives each state a badge and lets coaches act until the class ends', () => {
    expect(slotBadge('full')).toEqual({ label: 'Completa', tone: 'warning' })
    expect(slotBadge('open').label).toBe('Abierta')
    expect(canManageSlot('started')).toBe(true)
    expect(canManageSlot('closed')).toBe(true)
    expect(canManageSlot('finished')).toBe(false)
    expect(canManageSlot('cancelled')).toBe(false)
  })

  it('counts places and the waitlist', () => {
    expect(slotCounts(slot({ bookedCount: 8 }))).toEqual({ places: '8/10', waitlist: null })
    expect(slotCounts(slot({ bookedCount: 10, waitlistCount: 2 }))).toEqual({ places: '10/10', waitlist: '+2 en espera' })
  })
})

describe('buildRoster', () => {
  const clients = new Map<string, RosterClient>([
    ['c1', { id: 'c1', firstName: 'Laura', lastName: 'Martín', color: '#000', plan: 'plus', trainingDays: 3 }],
    ['c2', { id: 'c2', firstName: 'Javier', lastName: '', color: '#000', plan: 'standard', trainingDays: 2 }],
    ['c3', { id: 'c3', firstName: 'Marta', lastName: 'Hernández', color: '#000', plan: 'elite', trainingDays: 4 }],
  ])

  it('lists places in arrival order and numbers the waitlist, only for that class', () => {
    const roster = buildRoster(
      [
        booking('b3', { queueOrder: 5, status: 'waitlisted' }),
        booking('b2', { queueOrder: 2 }),
        booking('b1', { queueOrder: 4, status: 'waitlisted' }),
        booking('b4', { queueOrder: 1, clientId: 'gone' }),
        booking('b9', { slotId: 'other' }),
      ],
      's1',
      clients,
    )
    expect(roster.booked.map((e) => e.name)).toEqual(['Usuario eliminado', 'Javier'])
    expect(roster.booked[0].client).toBeNull()
    expect(roster.waitlist.map((e) => [e.name, e.position])).toEqual([
      ['Laura Martín', 1],
      ['Marta Hernández', 2],
    ])
  })

  it('knows who is already in a class', () => {
    expect(peopleInSlot([booking('b1'), booking('b2', { slotId: 'other' })], 's1')).toEqual(new Set(['c1']))
  })
})

describe('moveTargets', () => {
  it('offers only running classes the person is not in yet', () => {
    const slots = [slot(), slot({ id: 's2' }), slot({ id: 's3' }), slot({ id: 's4', status: 'cancelled' }), slot({ id: 's5', startsAt: START - 2 * HOUR })]
    const bookings = [booking('b1'), booking('b2', { slotId: 's2', clientId: 'c1', status: 'waitlisted' }), booking('b9', { slotId: 's3', clientId: 'other' })]
    const targets = moveTargets(slots, bookings, 's1', 'c1', START - HOUR)
    expect(targets.map((t) => [t.slot.id, t.current, t.alreadyIn, t.available])).toEqual([
      ['s1', true, false, false],
      ['s2', false, true, false],
      ['s3', false, false, true],
      ['s4', false, false, false],
      ['s5', false, false, false],
    ])
  })
})
