// Numbers and choices of the classes feature (texts live in copy.ts).

import { BOOKING_LIMITS } from '@shared/booking'

/** Live changes arriving this close together reload the classes once. */
export const CLASSES_RELOAD_DEBOUNCE_MS = 250
/** The class states on screen (en curso, terminada…) are worked out again this often. */
export const CLASSES_CLOCK_TICK_MS = 30_000
/** Name of the live channel (a unique suffix is added per subscription). */
export const CLASSES_CHANNEL = 'p33-classes'
/** Wide enough for the list of classes and, beside it, the people of the one picked. */
export const CLASSES_TWO_PANES_QUERY = '(min-width: 1024px)'

/** The name a new class or timetable entry starts with. */
export const DEFAULT_CLASS_NAME = 'Entrenamiento'
export const DEFAULT_CLASS_DURATION = 60
export const DEFAULT_CLASS_CAPACITY = 8
/** A new class starts at the next whole hour, but never before this time or after the last one. */
export const DEFAULT_CLASS_START_MINUTES = 18 * 60

/** Start times offered (every 15 min, 05:00 to 23:00). */
export const CLASS_TIME_STEP_MINUTES = 15
export const CLASS_FIRST_START_MINUTES = 5 * 60
export const CLASS_LAST_START_MINUTES = 23 * 60

export const CLASS_DURATION_OPTIONS = [30, 45, 60, 75, 90, 120] as const

/** How many classes a plan may book per week, offered as fixed numbers. */
export const QUOTA_NUMBER_OPTIONS = Array.from(
  { length: BOOKING_LIMITS.weeklyQuota.max - BOOKING_LIMITS.weeklyQuota.min + 1 },
  (_, i) => BOOKING_LIMITS.weeklyQuota.min + i,
)

/** Presets of the booking rules (a value saved outside them is still offered). */
export const HORIZON_DAY_OPTIONS = [1, 2, 3, 7, 14, 21, 30, 60] as const
export const CANCEL_MINUTE_OPTIONS = [0, 30, 60, 120, 180, 360, 720, 1440, 2880] as const
export const PROMOTE_MINUTE_OPTIONS = [0, 15, 30, 60, 120, 240] as const

/** People shown at once in "Añadir usuario" (the search narrows them). */
export const ADD_PERSON_RESULTS_MAX = 40
/** Next classes shown on the user's page. */
export const CLIENT_UPCOMING_MAX = 5
