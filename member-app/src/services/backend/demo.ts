// The offline demo: same answers as the cloud, kept in memory with made-up data (nothing is saved, nothing is sent).
// It applies the same rules as the database through the shared helpers: places, waitlist, weekly classes, late cancel.

import { BOOKING_DEFAULTS, MINUTE_MS, type BookingSettings } from '@shared/booking/constants.ts'
import type { MyBookingRow, MyRoutineSession } from '@shared/booking/memberRpc.ts'
import type { ClassSlotListRow } from '@shared/booking/rpc.ts'
import { isLateCancel, slotState, spotsLeft } from '@shared/booking/slots.ts'
import { addGymDays, gymTimeToMs, gymWeekday, gymWeekOf, toGymDate } from '@shared/booking/week.ts'
import { COPY } from '@/config/copy'
import { isAcceptablePassword } from '@/lib/accountRules'
import { rpcErrorMessage, UserFacingError } from '@/lib/errors'
import {
  DEMO_CAPACITY,
  DEMO_CLIENT_ID,
  DEMO_LAST_WEEKDAY,
  DEMO_MEMBER,
  DEMO_NEW_ACCOUNT_PREFIX,
  DEMO_TIMETABLE,
  DEMO_WEEKLY_QUOTA,
  demoProgram,
} from './demoData'
import type { MemberBackend } from './types'

interface DemoSlot {
  id: string
  startsAt: number
  gymDate: string
  duration: number
  name: string
  /** Other people with a place. */
  others: number
}

interface DemoBooking {
  id: string
  slotId: string
  status: 'booked' | 'waitlisted' | 'cancelled' | 'late_cancelled'
  /** Order of arrival among the waitlist (lower first). */
  queue: number
}

const fail = (code: string): never => {
  throw new UserFacingError(rpcErrorMessage(code))
}

/** Some classes full, most with places, always the same for a given day. */
const othersFor = (dayIndex: number, slotIndex: number) => ((dayIndex * 7 + slotIndex * 3) % 5 === 0 ? DEMO_CAPACITY : (dayIndex + slotIndex * 2) % 9)

function buildSlots(now: number, settings: BookingSettings): DemoSlot[] {
  const today = toGymDate(now)
  const slots: DemoSlot[] = []
  for (let dayIndex = 0; dayIndex <= settings.horizonDays; dayIndex += 1) {
    const gymDate = addGymDays(today, dayIndex)
    if (gymWeekday(gymDate) > DEMO_LAST_WEEKDAY) continue
    DEMO_TIMETABLE.forEach((entry, slotIndex) => {
      slots.push({
        id: `demo-slot-${gymDate}-${slotIndex}`,
        startsAt: gymTimeToMs(gymDate, entry.start),
        gymDate,
        duration: entry.duration,
        name: entry.name,
        others: othersFor(dayIndex, slotIndex),
      })
    })
  }
  return slots
}

export function createDemoBackend(now: () => number = Date.now): MemberBackend {
  const settings: BookingSettings = BOOKING_DEFAULTS
  const slots = buildSlots(now(), settings)
  const listeners = new Set<(signedIn: boolean) => void>()
  const bookingListeners = new Set<() => void>()
  let signedIn = false
  let mustChangePassword = false
  let nextId = 1
  let bookings: DemoBooking[] = []

  const emit = () => listeners.forEach((listener) => listener(signedIn))
  const changed = () => bookingListeners.forEach((listener) => setTimeout(listener, 0))
  const slotById = (id: string) => slots.find((slot) => slot.id === id) ?? fail('slot_not_found')
  const active = (booking: DemoBooking) => booking.status === 'booked' || booking.status === 'waitlisted'
  const bookedIn = (slotId: string) => bookings.filter((b) => b.slotId === slotId && b.status === 'booked').length
  const waitlistOf = (slotId: string) =>
    bookings.filter((b) => b.slotId === slotId && b.status === 'waitlisted').sort((a, b) => a.queue - b.queue)
  const position = (booking: DemoBooking) => waitlistOf(booking.slotId).indexOf(booking) + 1
  const snapshot = (slot: DemoSlot) => ({
    startsAt: slot.startsAt,
    durationMinutes: slot.duration,
    status: 'open' as const,
    capacity: DEMO_CAPACITY,
    bookedCount: slot.others + bookedIn(slot.id),
  })

  function usedThisWeek(at: number): number {
    const week = gymWeekOf(at)
    return bookings.filter((b) => {
      const slot = slotById(b.slotId)
      return slot.startsAt >= week.startsAt && slot.startsAt < week.endsAt && (active(b) || b.status === 'late_cancelled')
    }).length
  }

  function requireMember() {
    if (!signedIn || mustChangePassword) fail('not_member')
  }

  function add(slotId: string, status: DemoBooking['status']): DemoBooking {
    const booking = { id: `demo-booking-${nextId}`, slotId, status, queue: nextId }
    nextId += 1
    bookings = [...bookings, booking]
    return booking
  }

  // A class already booked on the next day with places, so "Mis clases" has something to show.
  const firstBooked = slots.find((slot) => slot.gymDate !== toGymDate(now()) && slot.others < DEMO_CAPACITY)
  if (firstBooked) add(firstBooked.id, 'booked')

  return {
    mode: 'demo',

    hasSession: async () => signedIn,

    onSessionChange(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    async signIn(identifier, password) {
      if (!identifier.trim() || !password) throw new UserFacingError(COPY.loginErrors.invalid_credentials)
      signedIn = true
      mustChangePassword = identifier.trim().toLowerCase().startsWith(DEMO_NEW_ACCOUNT_PREFIX)
      emit()
    },

    async signOut() {
      signedIn = false
      emit()
    },

    async changePassword(password) {
      if (!isAcceptablePassword(password)) throw new UserFacingError(COPY.password.notChanged)
      mustChangePassword = false
    },

    async myMember() {
      if (!signedIn) return null
      return { ...DEMO_MEMBER, must_change_password: mustChangePassword }
    },

    bookingSettings: async () => settings,

    async myBookings() {
      requireMember()
      const at = now()
      return bookings
        .filter(active)
        .map((booking): MyBookingRow => {
          const slot = slotById(booking.slotId)
          return {
            booking_id: booking.id,
            slot_id: slot.id,
            starts_at: new Date(slot.startsAt).toISOString(),
            gym_date: slot.gymDate,
            duration_minutes: slot.duration,
            name: slot.name,
            slot_status: 'open',
            status: booking.status === 'booked' ? 'booked' : 'waitlisted',
            waitlist_position: booking.status === 'waitlisted' ? position(booking) : null,
          }
        })
        .filter((row) => Date.parse(row.starts_at) + row.duration_minutes * MINUTE_MS > at)
    },

    async myWeekUsage(day) {
      requireMember()
      // Midday of that day: always inside its gym week.
      const at = day ? gymTimeToMs(day, 12 * 60) : now()
      return { week_start: gymWeekOf(at).monday, used: usedThisWeek(at), quota: DEMO_WEEKLY_QUOTA }
    },

    async classSlots(from, to) {
      requireMember()
      return slots
        .filter((slot) => slot.gymDate >= from && slot.gymDate <= to)
        .map((slot): ClassSlotListRow => {
          const mine = bookings.find((b) => b.slotId === slot.id && active(b))
          return {
            id: slot.id,
            template_id: null,
            starts_at: new Date(slot.startsAt).toISOString(),
            gym_date: slot.gymDate,
            duration_minutes: slot.duration,
            capacity: DEMO_CAPACITY,
            name: slot.name,
            status: 'open',
            edited: false,
            booked_count: snapshot(slot).bookedCount,
            waitlist_count: waitlistOf(slot.id).length,
            my_status: mine ? (mine.status === 'booked' ? 'booked' : 'waitlisted') : null,
            my_booking_id: mine?.id ?? null,
          }
        })
    },

    async bookClass(slotId) {
      requireMember()
      const slot = slotById(slotId)
      if (bookings.some((b) => b.slotId === slotId && active(b))) fail('already_booked')
      const state = slotState(snapshot(slot), now(), settings)
      if (state === 'started' || state === 'finished' || state === 'too_far' || state === 'full') {
        fail(state === 'full' ? 'waitlist_closed' : state === 'finished' ? 'slot_finished' : state === 'started' ? 'slot_started' : 'too_far')
      }
      if (usedThisWeek(slot.startsAt) >= DEMO_WEEKLY_QUOTA) fail('quota_reached')
      const booking = add(slotId, spotsLeft(snapshot(slot)) > 0 ? 'booked' : 'waitlisted')
      changed()
      return {
        booking_id: booking.id,
        status: booking.status === 'booked' ? 'booked' : 'waitlisted',
        waitlist_position: booking.status === 'waitlisted' ? position(booking) : null,
      }
    },

    async cancelBooking(bookingId) {
      requireMember()
      const booking = bookings.find((b) => b.id === bookingId && active(b)) ?? fail('booking_not_found')
      const slot = slotById(booking.slotId)
      if (now() >= slot.startsAt) fail('slot_started')
      const late = booking.status === 'booked' && isLateCancel({ startsAt: slot.startsAt, durationMinutes: slot.duration }, now(), settings)
      const status = late ? 'late_cancelled' : 'cancelled'
      bookings = bookings.map((b) => (b.id === bookingId ? { ...b, status } : b))
      changed()
      return { booking_id: bookingId, status, counts: late && settings.lateCancelCounts, promoted: 0 }
    },

    async myRoutine() {
      requireMember()
      const today = toGymDate(now())
      const program = demoProgram(addGymDays(today, -8), addGymDays(today, 19))
      const yesterday = addGymDays(today, -1)
      const sessions: MyRoutineSession[] = [
        {
          client_id: DEMO_CLIENT_ID,
          gym_date: yesterday,
          program_id: program.id,
          day_id: program.days[0].id,
          day_number: 1,
          slot_id: null,
          created_at: `${yesterday}T18:00:00.000Z`,
        },
      ]
      return { program, sessions }
    },

    async deleteAccount() {
      bookings = []
      signedIn = false
      emit()
    },

    watchMyBookings(_clientId, onChange) {
      bookingListeners.add(onChange)
      return () => bookingListeners.delete(onChange)
    },
  }
}
