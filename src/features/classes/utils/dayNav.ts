// The day picked on the Clases page and the week strip above its classes.

import { gymWeekDates, isValidGymDate, type GymDate } from '@shared/booking'
import { WEEKDAY_LETTERS } from '@/features/classes/config/copy'

export interface WeekStripDay {
  date: GymDate
  letter: string
  dayOfMonth: number
  isToday: boolean
  isSelected: boolean
}

/** The `?dia=` of the address, or today when it is missing or not a real date. */
export function resolveClassDay(raw: string | null, today: GymDate): GymDate {
  return raw && isValidGymDate(raw) ? raw : today
}

/** Monday to Sunday of the picked day's week. */
export function weekStrip(selected: GymDate, today: GymDate): WeekStripDay[] {
  return gymWeekDates(selected).map((date, i) => ({
    date,
    letter: WEEKDAY_LETTERS[i],
    dayOfMonth: Number(date.slice(8)),
    isToday: date === today,
    isSelected: date === selected,
  }))
}
