// Local test mode: the coaches' booking actions with the rules of schema.sql (staff_add_booking, staff_remove_booking,
// staff_move_booking, staff_update_slot, staff_create_slot, promote_waitlist, staff_week_usage).

import { MINUTE_MS, slotEndMs, toGymDate } from '@shared/booking'
import type {
  AddBookingResult,
  ClientClasses,
  MoveBookingResult,
  NewSlotInput,
  RemoveBookingResult,
  SlotPatch,
  UpdateSlotResult,
} from '@/features/classes/types'
import {
  bookedCount,
  checkClassFields,
  cloneState,
  isActive,
  requireClient,
  slotForStaff,
  weeklyQuota,
  weekUsage,
  type LocalBooking,
  type LocalClassesState,
  type LocalSlot,
  type RuleContext,
  type RuleResult,
} from './localState'
import { ClassesError } from './types'

/** Free places go to the first of the waitlist who still have classes that week; only open classes, until promote_until_minutes before. */
function promote(state: LocalClassesState, slot: LocalSlot, ctx: RuleContext): number {
  const { settings } = state
  if (slot.status !== 'open' || !settings.waitlistEnabled || ctx.now >= slot.startsAt - settings.promoteUntilMinutes * MINUTE_MS) return 0
  let free = slot.capacity - bookedCount(state, slot.id)
  let promoted = 0
  const queue = state.bookings.filter((b) => b.slotId === slot.id && b.status === 'waitlisted').sort((a, b) => a.queueOrder - b.queueOrder)
  for (const booking of queue) {
    if (free <= 0) break
    const quota = weeklyQuota(state, ctx.clients, booking.clientId)
    if (quota !== null && weekUsage(state, booking.clientId, slot.gymDate) >= quota) continue
    booking.status = 'booked'
    promoted++
    free--
  }
  return promoted
}

function insertBooking(state: LocalClassesState, slot: LocalSlot, clientId: string, force: boolean, ctx: RuleContext): AddBookingResult {
  if (state.bookings.some((b) => b.slotId === slot.id && b.clientId === clientId && isActive(b))) throw new ClassesError('already_booked')
  const forced = bookedCount(state, slot.id) >= slot.capacity
  if (forced && !force) throw new ClassesError('slot_full')
  const quota = weeklyQuota(state, ctx.clients, clientId)
  const used = weekUsage(state, clientId, slot.gymDate)
  const booking: LocalBooking = {
    id: ctx.newId(), slotId: slot.id, clientId, status: 'booked', forced, addedBy: ctx.profileId, movedTo: null, queueOrder: state.nextQueueOrder++,
  }
  state.bookings.push(booking)
  return { bookingId: booking.id, forced, overQuota: quota !== null && used >= quota }
}

function activeBooking(state: LocalClassesState, bookingId: string): LocalBooking {
  const booking = state.bookings.find((b) => b.id === bookingId)
  if (!booking) throw new ClassesError('booking_not_found')
  return booking
}

export function addBooking(state: LocalClassesState, slotId: string, clientId: string, force: boolean, ctx: RuleContext): RuleResult<AddBookingResult> {
  const next = cloneState(state)
  requireClient(ctx.clients, clientId)
  const result = insertBooking(next, slotForStaff(next, slotId, ctx.now), clientId, force, ctx)
  return { state: next, result }
}

export function removeBooking(state: LocalClassesState, bookingId: string, ctx: RuleContext): RuleResult<RemoveBookingResult> {
  const next = cloneState(state)
  const booking = activeBooking(next, bookingId)
  const slot = slotForStaff(next, booking.slotId, ctx.now)
  if (booking.status !== 'booked' && booking.status !== 'waitlisted') throw new ClassesError('booking_not_found')
  const previousStatus = booking.status
  booking.status = 'removed'
  const promoted = previousStatus === 'booked' ? promote(next, slot, ctx) : 0
  return { state: next, result: { bookingId, slotId: slot.id, clientId: booking.clientId, previousStatus, promoted } }
}

export function moveBooking(state: LocalClassesState, bookingId: string, toSlotId: string, force: boolean, ctx: RuleContext): RuleResult<MoveBookingResult> {
  const next = cloneState(state)
  const booking = activeBooking(next, bookingId)
  if (booking.slotId === toSlotId) throw new ClassesError('already_booked')
  const from = slotForStaff(next, booking.slotId, ctx.now)
  const to = slotForStaff(next, toSlotId, ctx.now)
  if (booking.status !== 'booked' && booking.status !== 'waitlisted') throw new ClassesError('booking_not_found')
  const previousStatus = booking.status
  if (next.bookings.some((b) => b.slotId === to.id && b.clientId === booking.clientId && isActive(b))) throw new ClassesError('already_booked')
  if (bookedCount(next, to.id) >= to.capacity && !force) throw new ClassesError('slot_full')
  booking.status = 'removed'
  const added = insertBooking(next, to, booking.clientId, force, ctx)
  booking.movedTo = added.bookingId
  const promoted = previousStatus === 'booked' ? promote(next, from, ctx) : 0
  return { state: next, result: { ...added, promoted } }
}

export function updateSlot(state: LocalClassesState, slotId: string, patch: SlotPatch, ctx: RuleContext): RuleResult<UpdateSlotResult> {
  const next = cloneState(state)
  const old = slotForStaff(next, slotId, ctx.now)
  const startsAt = patch.startsAt ?? old.startsAt
  const slot: LocalSlot = {
    ...old,
    name: patch.name?.trim() ?? old.name,
    startsAt,
    gymDate: toGymDate(startsAt),
    durationMinutes: patch.durationMinutes ?? old.durationMinutes,
    capacity: patch.capacity ?? old.capacity,
    status: patch.status ?? old.status,
    edited: true,
  }
  checkClassFields(slot)
  next.slots = next.slots.map((s) => (s.id === slotId ? slot : s))
  const active = next.bookings.filter((b) => b.slotId === slotId && isActive(b))
  if (slot.status === 'cancelled') {
    for (const booking of active) booking.status = 'slot_cancelled'
    return { state: next, result: { status: slot.status, promoted: 0, notified: active.length } }
  }
  const timeChanged = slot.startsAt !== old.startsAt || slot.durationMinutes !== old.durationMinutes
  return { state: next, result: { status: slot.status, promoted: promote(next, slot, ctx), notified: timeChanged ? active.length : 0 } }
}

export function createSlot(state: LocalClassesState, input: NewSlotInput, ctx: RuleContext): RuleResult<string> {
  const next = cloneState(state)
  const slot: LocalSlot = {
    id: ctx.newId(), templateId: null, templateDate: null, startsAt: input.startsAt, gymDate: toGymDate(input.startsAt),
    durationMinutes: input.durationMinutes, capacity: input.capacity, name: input.name.trim(), status: 'open', edited: true,
  }
  if (slotEndMs(slot) <= ctx.now) throw new ClassesError('slot_finished')
  checkClassFields(slot)
  next.slots.push(slot)
  return { state: next, result: slot.id }
}

/** "Esta semana: 1 de 2" and the classes that have not ended, with the place in the waitlist. */
export function clientClasses(state: LocalClassesState, clientId: string, ctx: RuleContext): ClientClasses {
  const slots = new Map(state.slots.map((s) => [s.id, s]))
  const upcoming = state.bookings
    .flatMap((b) => {
      const slot = slots.get(b.slotId)
      if (b.clientId !== clientId || !slot || slotEndMs(slot) <= ctx.now || (b.status !== 'booked' && b.status !== 'waitlisted')) return []
      const ahead = state.bookings.filter((o) => o.slotId === b.slotId && o.status === 'waitlisted' && o.queueOrder < b.queueOrder).length
      const { templateDate: _templateDate, ...plain } = slot
      return [{ bookingId: b.id, slot: plain, status: b.status, waitlistPosition: b.status === 'waitlisted' ? ahead + 1 : null }]
    })
    .sort((a, b) => a.slot.startsAt - b.slot.startsAt)
  const today = toGymDate(ctx.now)
  return { usage: { used: weekUsage(state, clientId, today), quota: weeklyQuota(state, ctx.clients, clientId) }, upcoming }
}
