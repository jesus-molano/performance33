// Local test mode, first run: a realistic timetable (Monday to Friday, 07:00 to 21:00, one class an hour, 8 places)
// and some people in the next classes, one of them small and full with a forced place and a waitlist.

import { addGymDays, BOOKING_DEFAULTS, gymTimeToMs, gymWeekday, toGymDate, type GymDate } from '@shared/booking'
import { DEFAULT_CLASS_CAPACITY, DEFAULT_CLASS_DURATION, DEFAULT_CLASS_NAME } from '@/features/classes/config/classes'
import type { ClassTemplate } from '@/features/classes/types'
import { addBooking, updateSlot } from './localRules'
import { ensureSlots } from './localSchedule'
import type { LocalClassesState, RuleContext } from './localState'

const WEEKDAYS = [1, 2, 3, 4, 5]
const FIRST_HOUR = 7
const LAST_HOUR = 20
const SEED_DAYS = 14
const SMALL_CLASS_CAPACITY = 4

export function demoTemplates(newId: () => string): ClassTemplate[] {
  return WEEKDAYS.flatMap((weekday) =>
    Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => ({
      id: newId(),
      weekday,
      startMinutes: (FIRST_HOUR + i) * 60,
      durationMinutes: DEFAULT_CLASS_DURATION,
      capacity: DEFAULT_CLASS_CAPACITY,
      name: DEFAULT_CLASS_NAME,
      active: true,
    })),
  )
}

/** The next weekday from today whose 18:00 class has not started yet. */
function nextClassDay(from: GymDate, now: number): GymDate {
  let day = from
  while (!WEEKDAYS.includes(gymWeekday(day)) || gymTimeToMs(day, 18 * 60) <= now) day = addGymDays(day, 1)
  return day
}

function nextWeekday(after: GymDate): GymDate {
  let day = addGymDays(after, 1)
  while (!WEEKDAYS.includes(gymWeekday(day))) day = addGymDays(day, 1)
  return day
}

const slotAt = (state: LocalClassesState, day: GymDate, hour: number) => state.slots.find((s) => s.startsAt === gymTimeToMs(day, hour * 60))

/** `clientIds`: active people of the demo, in any order (none: just the timetable). */
export function createDemoClasses(clientIds: readonly string[], ctx: RuleContext): LocalClassesState {
  const today = toGymDate(ctx.now)
  let state: LocalClassesState = { settings: BOOKING_DEFAULTS, templates: demoTemplates(ctx.newId), slots: [], bookings: [], nextQueueOrder: 1 }
  state = ensureSlots(state, today, addGymDays(today, SEED_DAYS), ctx)

  const book = (slotId: string | undefined, ids: readonly string[], force = false) => {
    for (const id of ids) if (slotId) state = addBooking(state, slotId, id, force, ctx).state
  }
  const day = nextClassDay(today, ctx.now)
  const evening = slotAt(state, day, 18)
  const small = slotAt(state, day, 19)
  const morning = slotAt(state, nextWeekday(day), FIRST_HOUR)

  book(evening?.id, clientIds.slice(0, 5))
  if (small) {
    state = updateSlot(state, small.id, { capacity: SMALL_CLASS_CAPACITY }, ctx).state
    book(small.id, clientIds.slice(0, SMALL_CLASS_CAPACITY))
    book(small.id, clientIds.slice(SMALL_CLASS_CAPACITY, SMALL_CLASS_CAPACITY + 1), true)
    for (const clientId of clientIds.slice(SMALL_CLASS_CAPACITY + 1, SMALL_CLASS_CAPACITY + 3)) {
      state.bookings.push({ id: ctx.newId(), slotId: small.id, clientId, status: 'waitlisted', forced: false, addedBy: null, movedTo: null, queueOrder: state.nextQueueOrder++ })
    }
  }
  book(morning?.id, clientIds.slice(1, 4))
  return state
}
