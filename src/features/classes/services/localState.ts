// Local test mode: the whole booking state of this browser, shaped like the cloud tables, and the reads both
// localSchedule.ts and localRules.ts share. Same rules as schema.sql (see each function there).

import {
  addGymDays,
  BOOKING_LIMITS,
  countsTowardQuota,
  gymMonday,
  slotEndMs,
  weeklyQuotaFor,
  type BookingSettings,
  type BookingStatus,
  type GymDate,
} from '@shared/booking'
import type { Client } from '@/types'
import type { ClassSlot, ClassTemplate } from '@/features/classes/types'
import { ClassesError } from './types'

export interface LocalSlot extends ClassSlot {
  /** The day the timetable made it for; null for a class added by hand. */
  templateDate: GymDate | null
}

export interface LocalBooking {
  id: string
  slotId: string
  clientId: string
  status: BookingStatus
  forced: boolean
  addedBy: string | null
  movedTo: string | null
  queueOrder: number
}

export interface LocalClassesState {
  settings: BookingSettings
  templates: ClassTemplate[]
  slots: LocalSlot[]
  bookings: LocalBooking[]
  nextQueueOrder: number
}

export type QuotaClient = Pick<Client, 'id' | 'plan' | 'trainingDays'>

export interface RuleContext {
  now: number
  clients: readonly QuotaClient[]
  profileId: string | null
  newId: () => string
}

export interface RuleResult<T> {
  state: LocalClassesState
  result: T
}

/** Every rule works on a copy: the stored state only changes when the whole action worked. */
export const cloneState = (state: LocalClassesState): LocalClassesState => structuredClone(state)

export const isActive = (b: LocalBooking) => b.status === 'booked' || b.status === 'waitlisted'

export const bookedCount = (state: LocalClassesState, slotId: string): number =>
  state.bookings.filter((b) => b.slotId === slotId && b.status === 'booked').length

/** Classes per week of that person (null = no limit): weekly_quota. */
export function weeklyQuota(state: LocalClassesState, clients: readonly QuotaClient[], clientId: string): number | null {
  const client = clients.find((c) => c.id === clientId)
  return weeklyQuotaFor(client?.plan ?? 'standard', client?.trainingDays ?? 0, state.settings)
}

/** Classes used in the gym week of that day: week_usage. A class the gym cancelled never counts. */
export function weekUsage(state: LocalClassesState, clientId: string, day: GymDate): number {
  const monday = gymMonday(day)
  const sunday = addGymDays(monday, 6)
  const slotDays = new Map(state.slots.filter((s) => s.status !== 'cancelled').map((s) => [s.id, s.gymDate]))
  return state.bookings.filter((b) => {
    const date = slotDays.get(b.slotId)
    return b.clientId === clientId && date !== undefined && date >= monday && date <= sunday && countsTowardQuota(b.status, state.settings)
  }).length
}

/** The class for a coach's action: it must exist, not be cancelled and not be over (lock_slot_for_staff). */
export function slotForStaff(state: LocalClassesState, slotId: string, now: number): LocalSlot {
  const slot = state.slots.find((s) => s.id === slotId)
  if (!slot) throw new ClassesError('slot_not_found')
  if (slot.status === 'cancelled') throw new ClassesError('slot_cancelled')
  if (slotEndMs(slot) <= now) throw new ClassesError('slot_finished')
  return slot
}

export function requireClient(clients: readonly QuotaClient[], clientId: string): void {
  if (!clients.some((c) => c.id === clientId)) throw new ClassesError('client_not_found')
}

/**
 * A deleted user takes their bookings with them (on delete cascade), also after "Restablecer datos de demostración".
 * With no users known yet nothing is dropped.
 */
export function withoutDeletedClients(state: LocalClassesState, clients: readonly QuotaClient[]): LocalClassesState {
  if (!clients.length) return state
  const ids = new Set(clients.map((c) => c.id))
  return { ...state, bookings: state.bookings.filter((b) => ids.has(b.clientId)) }
}

const within =(value: number, { min, max }: { min: number; max: number }) => Number.isInteger(value) && value >= min && value <= max

/** The table checks of a class or a timetable entry (a refused value is 'unknown', as a check violation is in the cloud). */
export function checkClassFields(fields: Pick<ClassSlot, 'name' | 'capacity' | 'durationMinutes'>): void {
  const length = fields.name.trim().length
  const ok =
    within(fields.capacity, BOOKING_LIMITS.capacity) &&
    within(fields.durationMinutes, BOOKING_LIMITS.durationMinutes) &&
    length >= BOOKING_LIMITS.className.min &&
    length <= BOOKING_LIMITS.className.max
  if (!ok) throw new ClassesError('unknown')
}
