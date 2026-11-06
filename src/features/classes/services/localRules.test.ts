import { BOOKING_DEFAULTS, gymTimeToMs } from '@shared/booking'
import { describe, expect, it } from 'vitest'
import type { ClassTemplate } from '@/features/classes/types'
import { addBooking, clientClasses, createSlot, moveBooking, removeBooking, updateSlot } from './localRules'
import { listDay, removeTemplate, saveTemplates } from './localSchedule'
import { createDemoClasses } from './localSeed'
import { withoutDeletedClients, type LocalClassesState, type QuotaClient, type RuleContext } from './localState'
import { ClassesError } from './types'

// Friday 6 November 2026, 10:00 in the gym (winter: gym time = UTC).
const NOW = gymTimeToMs('2026-11-06', 10 * 60)
const DAY = '2026-11-06'

const clients: QuotaClient[] = [
  { id: 'ana', plan: 'standard', trainingDays: 2 },
  { id: 'luis', plan: 'standard', trainingDays: 2 },
  { id: 'marta', plan: 'elite', trainingDays: 4 },
  { id: 'pepe', plan: 'plus', trainingDays: 3 },
]

function context(now = NOW): RuleContext {
  let n = 0
  return { now, clients, profileId: 'coach', newId: () => `id${++n}` }
}

const template = (patch: Partial<ClassTemplate> = {}): ClassTemplate => ({
  id: 't18', weekday: 5, startMinutes: 18 * 60, durationMinutes: 60, capacity: 2, name: 'Entrenamiento', active: true, ...patch,
})

function stateWith(templates: ClassTemplate[]): LocalClassesState {
  return { settings: BOOKING_DEFAULTS, templates, slots: [], bookings: [], nextQueueOrder: 1 }
}

/** The day listed once (its classes created), with a context whose ids do not clash with those classes. */
function dayState(templates = [template()]) {
  const { state, result } = listDay(stateWith(templates), DAY, context())
  let n = 100
  const ctx: RuleContext = { ...context(), newId: () => `id${++n}` }
  return { state, slots: result.slots, ctx }
}

const codeOf = (run: () => unknown) => {
  try {
    run()
  } catch (error) {
    return error instanceof ClassesError ? error.code : 'other'
  }
  return null
}

describe('local timetable', () => {
  it('creates the classes of a day once, only those that have not started', () => {
    const early = template({ id: 't7', startMinutes: 7 * 60 })
    const { state, slots } = dayState([early, template()])
    expect(slots.map((s) => s.templateId)).toEqual(['t18'])
    expect(slots[0]).toMatchObject({ gymDate: DAY, startsAt: gymTimeToMs(DAY, 1080), bookedCount: 0, capacity: 2 })
    expect(listDay(state, DAY, context()).result.slots).toHaveLength(1)
    expect(listDay(stateWith([template()]), '2026-11-07', context()).result.slots).toEqual([])
  })

  it('a timetable change remakes empty future classes and leaves those with people alone', () => {
    const { state, slots, ctx } = dayState()
    const booked = addBooking(state, slots[0].id, 'ana', false, ctx).state
    const edited = saveTemplates(booked, [template({ capacity: 6 })], ctx)
    expect(listDay(edited, DAY, ctx).result.slots[0].capacity).toBe(2)
    const empty = saveTemplates(state, [template({ capacity: 6 })], ctx)
    expect(listDay(empty, DAY, ctx).result.slots.map((s) => s.capacity)).toEqual([6])
  })

  it('removing a timetable entry keeps classes with people, unlinked', () => {
    const { state, slots, ctx } = dayState()
    const booked = addBooking(state, slots[0].id, 'ana', false, ctx).state
    const after = removeTemplate(booked, 't18', ctx)
    expect(after.templates).toEqual([])
    expect(after.slots.map((s) => s.templateId)).toEqual([null])
    expect(removeTemplate(state, 't18', ctx).slots).toEqual([])
  })
})

describe('local coach actions', () => {
  it('adds people until full, then only when forced', () => {
    const { state: start, slots, ctx } = dayState()
    const slotId = slots[0].id
    let state = addBooking(start, slotId, 'ana', false, ctx).state
    state = addBooking(state, slotId, 'luis', false, ctx).state
    expect(codeOf(() => addBooking(state, slotId, 'marta', false, ctx))).toBe('slot_full')
    const forced = addBooking(state, slotId, 'marta', true, ctx)
    expect(forced.result).toMatchObject({ forced: true, overQuota: false })
    expect(codeOf(() => addBooking(forced.state, slotId, 'ana', true, ctx))).toBe('already_booked')
    expect(codeOf(() => addBooking(state, slotId, 'nobody', false, ctx))).toBe('client_not_found')
    expect(codeOf(() => addBooking(state, 'missing', 'ana', false, ctx))).toBe('slot_not_found')
    expect(listDay(forced.state, DAY, ctx).result.slots[0].bookedCount).toBe(3)
  })

  it('warns when the person already used the week, without refusing', () => {
    const { state: start, ctx } = dayState([template({ id: 'a', startMinutes: 1080, capacity: 9 }), template({ id: 'b', startMinutes: 1140, capacity: 9 }), template({ id: 'c', startMinutes: 1200, capacity: 9 })])
    const ids = listDay(start, DAY, ctx).result.slots.map((s) => s.id)
    let state = addBooking(start, ids[0], 'ana', false, ctx).state
    state = addBooking(state, ids[1], 'ana', false, ctx).state
    expect(addBooking(state, ids[2], 'ana', false, ctx).result.overQuota).toBe(true)
    expect(clientClasses(state, 'ana', ctx).usage).toEqual({ used: 2, quota: 2 })
  })

  it('a late cancellation stops counting once the gym cancels that class', () => {
    const { state: start, slots, ctx } = dayState([template({ capacity: 9 })])
    const slotId = slots[0].id
    const state = addBooking(start, slotId, 'ana', false, ctx).state
    state.bookings[0].status = 'late_cancelled'
    expect(clientClasses(state, 'ana', ctx).usage.used).toBe(1)
    const cancelled = updateSlot(state, slotId, { status: 'cancelled' }, ctx).state
    expect(clientClasses(cancelled, 'ana', ctx).usage.used).toBe(0)
  })

  it('removing someone lets the first of the waitlist in, skipping who has no classes left', () => {
    const { state: start, slots, ctx } = dayState([template({ capacity: 1 })])
    const slotId = slots[0].id
    let state = addBooking(start, slotId, 'ana', false, ctx).state
    state.bookings.push(
      { id: 'w1', slotId, clientId: 'luis', status: 'waitlisted', forced: false, addedBy: null, movedTo: null, queueOrder: 50 },
      { id: 'w2', slotId, clientId: 'marta', status: 'waitlisted', forced: false, addedBy: null, movedTo: null, queueOrder: 51 },
    )
    state.slots.push({ ...state.slots[0], id: 'x1', templateId: null, templateDate: null, startsAt: gymTimeToMs('2026-11-05', 600) , gymDate: '2026-11-05' })
    state.slots.push({ ...state.slots[0], id: 'x2', templateId: null, templateDate: null, startsAt: gymTimeToMs('2026-11-04', 600), gymDate: '2026-11-04' })
    state.bookings.push(
      { id: 'u1', slotId: 'x1', clientId: 'luis', status: 'booked', forced: false, addedBy: null, movedTo: null, queueOrder: 2 },
      { id: 'u2', slotId: 'x2', clientId: 'luis', status: 'late_cancelled', forced: false, addedBy: null, movedTo: null, queueOrder: 3 },
    )
    const booking = state.bookings.find((b) => b.clientId === 'ana')!
    const removed = removeBooking(state, booking.id, ctx)
    expect(removed.result).toMatchObject({ previousStatus: 'booked', promoted: 1, clientId: 'ana' })
    expect(removed.state.bookings.find((b) => b.id === 'w2')?.status).toBe('booked')
    expect(removed.state.bookings.find((b) => b.id === 'w1')?.status).toBe('waitlisted')
    expect(clientClasses(removed.state, 'luis', ctx).upcoming.map((u) => u.waitlistPosition)).toEqual([1])
    expect(codeOf(() => removeBooking(removed.state, booking.id, ctx))).toBe('booking_not_found')
  })

  it('does not move the waitlist in the last 30 minutes or in a closed class', () => {
    const { state: start, slots, ctx } = dayState([template({ capacity: 1 })])
    const slotId = slots[0].id
    const state = addBooking(start, slotId, 'ana', false, ctx).state
    state.bookings.push({ id: 'w1', slotId, clientId: 'marta', status: 'waitlisted', forced: false, addedBy: null, movedTo: null, queueOrder: 50 })
    const booking = state.bookings.find((b) => b.clientId === 'ana')!
    const late = { ...ctx, now: gymTimeToMs(DAY, 18 * 60 - 20) }
    expect(removeBooking(state, booking.id, late).result.promoted).toBe(0)
    const closed = updateSlot(state, slotId, { status: 'closed' }, ctx).state
    expect(removeBooking(closed, booking.id, ctx).result.promoted).toBe(0)
  })

  it('moves a person to another class, refusing a full one unless forced', () => {
    const { state: start, ctx } = dayState([template({ id: 'a', capacity: 1 }), template({ id: 'b', startMinutes: 1140, capacity: 1 })])
    const [a, b] = listDay(start, DAY, ctx).result.slots.map((s) => s.id)
    let state = addBooking(start, a, 'ana', false, ctx).state
    state = addBooking(state, b, 'luis', false, ctx).state
    const anaBooking = state.bookings.find((x) => x.clientId === 'ana')!
    expect(codeOf(() => moveBooking(state, anaBooking.id, b, false, ctx))).toBe('slot_full')
    expect(codeOf(() => moveBooking(state, anaBooking.id, a, false, ctx))).toBe('already_booked')
    const moved = moveBooking(state, anaBooking.id, b, true, ctx)
    expect(moved.result.forced).toBe(true)
    const old = moved.state.bookings.find((x) => x.id === anaBooking.id)!
    expect(old).toMatchObject({ status: 'removed', movedTo: moved.result.bookingId })
  })

  it('edits a class: more places promote, cancelling ends every booking for good', () => {
    const { state: start, slots, ctx } = dayState([template({ capacity: 1 })])
    const slotId = slots[0].id
    const state = addBooking(start, slotId, 'ana', false, ctx).state
    state.bookings.push({ id: 'w1', slotId, clientId: 'marta', status: 'waitlisted', forced: false, addedBy: null, movedTo: null, queueOrder: 50 })
    const bigger = updateSlot(state, slotId, { capacity: 3, name: ' Fuerza ' }, ctx)
    expect(bigger.result).toEqual({ status: 'open', promoted: 1, notified: 0 })
    expect(bigger.state.slots[0]).toMatchObject({ name: 'Fuerza', edited: true })
    const moved = updateSlot(state, slotId, { startsAt: gymTimeToMs(DAY, 19 * 60) }, ctx)
    expect(moved.result.notified).toBe(2)
    const cancelled = updateSlot(state, slotId, { status: 'cancelled' }, ctx)
    expect(cancelled.result.notified).toBe(2)
    expect(cancelled.state.bookings.every((b) => b.status === 'slot_cancelled')).toBe(true)
    expect(codeOf(() => updateSlot(cancelled.state, slotId, { status: 'open' }, ctx))).toBe('slot_cancelled')
    expect(codeOf(() => updateSlot(state, slotId, { capacity: 0 }, ctx))).toBe('unknown')
  })

  it('adds a one-off class unless it is already over', () => {
    const { state, ctx } = dayState([])
    const input = { startsAt: gymTimeToMs(DAY, 12 * 60), durationMinutes: 60, capacity: 6, name: ' Movilidad ' }
    const created = createSlot(state, input, ctx)
    expect(listDay(created.state, DAY, ctx).result.slots[0]).toMatchObject({ id: created.result, name: 'Movilidad', edited: true, templateId: null })
    expect(codeOf(() => createSlot(state, { ...input, startsAt: gymTimeToMs(DAY, 8 * 60) }, ctx))).toBe('slot_finished')
  })

  it('forgets bookings of deleted users, unless no users are known yet', () => {
    const { state: start, slots, ctx } = dayState()
    const state = addBooking(start, slots[0].id, 'ana', false, ctx).state
    expect(withoutDeletedClients(state, [{ id: 'luis', plan: 'standard', trainingDays: 2 }]).bookings).toEqual([])
    expect(withoutDeletedClients(state, []).bookings).toHaveLength(1)
  })
})

describe('local demo', () => {
  it('makes a weekday timetable and fills the next classes, one small and full with a waitlist', () => {
    const ids = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']
    const ctx = { ...context(), clients: ids.map((id) => ({ id, plan: 'elite' as const, trainingDays: 4 })) }
    const state = createDemoClasses(ids, ctx)
    expect(state.templates).toHaveLength(5 * 14)
    expect(new Set(state.templates.map((t) => t.weekday))).toEqual(new Set([1, 2, 3, 4, 5]))
    const day = listDay(state, DAY, ctx).result
    const at = (hour: number) => day.slots.find((s) => s.startsAt === gymTimeToMs(DAY, hour * 60))!
    expect(at(18)).toMatchObject({ bookedCount: 5, capacity: 8 })
    expect(at(19)).toMatchObject({ bookedCount: 5, capacity: 4, waitlistCount: 1, edited: true })
    expect(day.bookings.filter((b) => b.forced)).toHaveLength(1)
    expect(listDay(state, '2026-11-09', ctx).result.slots[0].bookedCount).toBe(3)
  })
})
