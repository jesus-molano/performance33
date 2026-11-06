// How a class looks to the coaches (state badge, counts) and who is in it, in arrival order.

import { slotEndMs, slotStartMs, type Instant, toMs } from '@shared/booking'
import type { BadgeTone } from '@/components/ui'
import { formatFullName } from '@/lib/format'
import type { Client } from '@/types'
import { CLASSES_COPY, SLOT_BADGE_COPY } from '@/features/classes/config/copy'
import type { Booking, SlotSummary } from '@/features/classes/types'

/** For coaches: a class far ahead is simply open, and a full one stays "Completa" whatever the waitlist does. */
export type StaffSlotState = keyof typeof SLOT_BADGE_COPY

export function staffSlotState(slot: SlotSummary, now: Instant): StaffSlotState {
  const nowMs = toMs(now)
  if (slot.status === 'cancelled') return 'cancelled'
  if (nowMs >= slotEndMs(slot)) return 'finished'
  if (nowMs >= slotStartMs(slot)) return 'started'
  if (slot.status === 'closed') return 'closed'
  return slot.bookedCount >= slot.capacity ? 'full' : 'open'
}

const STATE_TONES: Record<StaffSlotState, BadgeTone> = {
  open: 'success',
  full: 'warning',
  closed: 'neutral',
  cancelled: 'danger',
  started: 'info',
  finished: 'neutral',
}

export function slotBadge(state: StaffSlotState): { label: string; tone: BadgeTone } {
  return { label: SLOT_BADGE_COPY[state], tone: STATE_TONES[state] }
}

/** Coaches can still add, remove or change people until the class ends (the server says the same). */
export function canManageSlot(state: StaffSlotState): boolean {
  return state !== 'cancelled' && state !== 'finished'
}

/** '8/10' and, with a waitlist, '+2 en espera'. */
export function slotCounts(slot: Pick<SlotSummary, 'bookedCount' | 'capacity' | 'waitlistCount'>): { places: string; waitlist: string | null } {
  return {
    places: CLASSES_COPY.counts(slot.bookedCount, slot.capacity),
    waitlist: slot.waitlistCount ? CLASSES_COPY.waitlist(slot.waitlistCount) : null,
  }
}

export type RosterClient = Pick<Client, 'id' | 'firstName' | 'lastName' | 'color' | 'plan' | 'trainingDays'>

export interface RosterEntry {
  booking: Booking
  /** Null when the user was deleted meanwhile. */
  client: RosterClient | null
  name: string
  /** Place in the waitlist, from 1; null with a place. */
  position: number | null
}

export interface Roster {
  booked: RosterEntry[]
  waitlist: RosterEntry[]
}

const UNKNOWN_PERSON = 'Usuario eliminado'

/** The people of one class: those with a place in order of arrival, then the waitlist numbered. */
export function buildRoster(bookings: readonly Booking[], slotId: string, clients: ReadonlyMap<string, RosterClient>): Roster {
  const own = bookings.filter((b) => b.slotId === slotId).sort((a, b) => a.queueOrder - b.queueOrder)
  const entry = (booking: Booking, position: number | null): RosterEntry => {
    const client = clients.get(booking.clientId) ?? null
    return { booking, client, name: client ? formatFullName(client.firstName, client.lastName) : UNKNOWN_PERSON, position }
  }
  return {
    booked: own.filter((b) => b.status === 'booked').map((b) => entry(b, null)),
    waitlist: own.filter((b) => b.status === 'waitlisted').map((b, i) => entry(b, i + 1)),
  }
}

/** Ids of the people who already hold a place or a waitlist spot in that class. */
export function peopleInSlot(bookings: readonly Booking[], slotId: string): Set<string> {
  return new Set(bookings.filter((b) => b.slotId === slotId).map((b) => b.clientId))
}

/** The DOM id of a class card, to bring it into view. */
export const slotCardDomId = (slotId: string) => `clase-${slotId}`

/** Where "Mover a otra clase" can take someone: classes still running that the person is not in already. */
export interface MoveTarget {
  slot: SlotSummary
  /** The class the person is in now. */
  current: boolean
  /** Another class the person already holds a place or a waitlist spot in. */
  alreadyIn: boolean
  available: boolean
}

export function moveTargets(slots: readonly SlotSummary[], bookings: readonly Booking[], fromSlotId: string, clientId: string, now: Instant): MoveTarget[] {
  const theirs = new Set(bookings.filter((b) => b.clientId === clientId).map((b) => b.slotId))
  return slots.map((slot) => {
    const current = slot.id === fromSlotId
    const alreadyIn = !current && theirs.has(slot.id)
    return { slot, current, alreadyIn, available: !current && !alreadyIn && canManageSlot(staffSlotState(slot, now)) }
  })
}
