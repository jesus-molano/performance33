// Days and times as the member reads them, always on the gym's clock (Atlantic/Canary), whatever the phone's zone.

import { addGymDays, diffGymDays, gymMinutesOfDay, gymWeekday, type GymDate, type Instant } from '@shared/booking/week.ts'
import { COPY } from '@/config/copy'

const pad = (n: number) => String(n).padStart(2, '0')

/** '18:00' on the gym's clock. */
export function formatGymTime(instant: Instant): string {
  const minutes = gymMinutesOfDay(instant)
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

/** 'Lun 10 nov'. */
export function formatGymDate(date: GymDate): string {
  const [, month, day] = date.split('-').map(Number)
  return `${COPY.dates.weekdays[gymWeekday(date) - 1]} ${day} ${COPY.dates.months[month - 1]}`
}

/** 'Hoy', 'Mañana' or 'Lun 10 nov'. */
export function formatDayLabel(date: GymDate, today: GymDate): string {
  const offset = diffGymDays(today, date)
  if (offset === 0) return COPY.dates.today
  if (offset === 1) return COPY.dates.tomorrow
  return formatGymDate(date)
}

/** The short weekday and the day of the month, for the day strip: { weekday: 'Lun', day: 10 }. */
export function dayChipParts(date: GymDate): { weekday: string; day: number } {
  return { weekday: COPY.dates.weekdays[gymWeekday(date) - 1], day: Number(date.slice(8, 10)) }
}

/** 120 → '2 h', 90 → '1 h 30 min', 45 → '45 min'. */
export function formatMinutesSpan(minutes: number): string {
  if (minutes < 60) return COPY.dates.minutes(minutes)
  return COPY.dates.hours(Math.floor(minutes / 60), minutes % 60)
}

/** Today and the next `days` days: the days a member can book. */
export function upcomingGymDays(today: GymDate, days: number): GymDate[] {
  return Array.from({ length: Math.max(0, days) + 1 }, (_, i) => addGymDays(today, i))
}
