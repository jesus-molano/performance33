// Times and days of classes as the gym reads them (gym clock, whatever zone the device is in).

import { diffGymDays, gymMinutesOfDay, gymWeekday, slotEndMs, type GymDate, type Instant } from '@shared/booking'
import { CLASS_FIRST_START_MINUTES, CLASS_LAST_START_MINUTES, CLASS_TIME_STEP_MINUTES } from '@/features/classes/config/classes'
import { CLASSES_COPY, MONTH_SHORT, WEEKDAY_NAMES, WEEKDAY_SHORT } from '@/features/classes/config/copy'

const pad = (n: number) => String(n).padStart(2, '0')
const MINUTES_PER_HOUR = 60
const MINUTES_PER_DAY = 1440

/** Minutes since midnight → '07:05'. */
export function formatMinutesOfDay(minutes: number): string {
  return `${pad(Math.floor(minutes / MINUTES_PER_HOUR) % 24)}:${pad(minutes % MINUTES_PER_HOUR)}`
}

/** A moment → '18:00' on the gym clock. */
export function formatGymTime(instant: Instant): string {
  return formatMinutesOfDay(gymMinutesOfDay(instant))
}

/** '18:00–19:00'. */
export function slotTimeRange(slot: { startsAt: number; durationMinutes: number }): string {
  return `${formatGymTime(slot.startsAt)}–${formatGymTime(slotEndMs(slot))}`
}

/** 'jueves 6 nov'. */
export function formatGymDay(date: GymDate): string {
  const [, month, day] = date.split('-').map(Number)
  return `${WEEKDAY_NAMES[gymWeekday(date) - 1].toLowerCase()} ${day} ${MONTH_SHORT[month - 1]}`
}

/** 'jue 6/11'. */
export function formatGymDayShort(date: GymDate): string {
  const [, month, day] = date.split('-').map(Number)
  return `${WEEKDAY_SHORT[gymWeekday(date) - 1]} ${day}/${month}`
}

/** 'Hoy', 'Mañana', 'Ayer' or null for any other day. */
export function relativeDayName(date: GymDate, today: GymDate): string | null {
  const offset = diffGymDays(today, date)
  if (offset === 0) return CLASSES_COPY.today
  if (offset === 1) return CLASSES_COPY.tomorrow
  if (offset === -1) return CLASSES_COPY.yesterday
  return null
}

/** Start times offered in the forms; a time saved outside the steps is offered too. */
export function classTimeOptions(current?: number): number[] {
  const steps: number[] = []
  for (let m = CLASS_FIRST_START_MINUTES; m <= CLASS_LAST_START_MINUTES; m += CLASS_TIME_STEP_MINUTES) steps.push(m)
  if (current !== undefined && !steps.includes(current)) steps.push(current)
  return steps.sort((a, b) => a - b)
}

/** A lead time in minutes → '30 min', '2 h', '1 h 30 min', '1 día', '2 días'; 0 → ''. */
export function formatLeadTime(minutes: number): string {
  if (minutes <= 0) return ''
  if (minutes % MINUTES_PER_DAY === 0) {
    const days = minutes / MINUTES_PER_DAY
    return `${days} ${days === 1 ? 'día' : 'días'}`
  }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const rest = minutes % MINUTES_PER_HOUR
  if (!hours) return `${rest} min`
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}
