import { describe, expect, it } from 'vitest'
import type { Booking } from '@/features/classes/types'
import { classFillOf } from './fill'

const booking = (id: string, clientId: string, queueOrder: number, status: Booking['status'] = 'booked', slotId = 's18'): Booking => ({
  id,
  slotId,
  clientId,
  status,
  forced: false,
  queueOrder,
})
const clients = new Map([
  ['ana', { id: 'ana', firstName: 'Ana', archived: false }],
  ['luis', { id: 'luis', firstName: 'Luis', archived: false }],
  ['marta', { id: 'marta', firstName: 'Marta', archived: false }],
  ['sergio', { id: 'sergio', firstName: 'Sergio', archived: true }],
])
const NEXT_DAYS = new Map([
  ['ana', 2],
  ['luis', 1],
  ['sergio', 3],
])
const nextDay = (id: string) => NEXT_DAYS.get(id) ?? null

describe('classFillOf', () => {
  it('takes the people with a place in arrival order, with their next day', () => {
    const bookings = [booking('b2', 'luis', 2), booking('b1', 'ana', 1), booking('b3', 'marta', 3)]
    expect(classFillOf(bookings, 's18', clients, nextDay).people).toEqual([
      { clientId: 'ana', name: 'Ana', day: 2 },
      { clientId: 'luis', name: 'Luis', day: 1 },
      { clientId: 'marta', name: 'Marta', day: null },
    ])
  })

  it('never the waitlist, another class, or someone deleted', () => {
    const bookings = [booking('b1', 'ana', 1, 'waitlisted'), booking('b2', 'luis', 2, 'booked', 's19'), booking('b3', 'ghost', 3)]
    expect(classFillOf(bookings, 's18', clients, nextDay).people).toEqual([])
  })

  it('archived people have nothing to show, and their sections count as free', () => {
    const fill = classFillOf([booking('b1', 'sergio', 1)], 's18', clients, nextDay)
    expect(fill.people).toEqual([{ clientId: 'sergio', name: 'Sergio', day: null }])
    expect([...fill.hidden]).toEqual(['sergio'])
  })
})
