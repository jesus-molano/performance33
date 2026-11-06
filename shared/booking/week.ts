// Dates and weeks in the gym's time zone (Atlantic/Canary), whatever zone the device is in.
// No Intl: Canary time follows the EU summer-time rule (UTC+0, UTC+1 from the last Sunday of March
// to the last Sunday of October, switching at 01:00 UTC), so it is computed here and works on Hermes too.
// A week runs Monday 00:00 to the next Monday 00:00, gym time.

import { DAY_MS, MINUTE_MS } from './constants.ts'

/** A calendar day in the gym, 'YYYY-MM-DD'. */
export type GymDate = string
/** A moment: a Date, epoch milliseconds or an ISO timestamp with offset (as Postgres sends timestamptz). */
export type Instant = Date | number | string

export interface GymWeek {
  /** Monday of the week. */
  monday: GymDate
  /** Monday 00:00 gym time, epoch ms (inclusive). */
  startsAt: number
  /** Next Monday 00:00 gym time, epoch ms (exclusive). */
  endsAt: number
}

const SUMMER_OFFSET_MINUTES = 60
const SWITCH_HOUR_UTC = 1
const DAYS_PER_WEEK = 7
const MARCH = 2
const OCTOBER = 9
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

const pad = (n: number) => String(n).padStart(2, '0')

export function toMs(instant: Instant): number {
  if (typeof instant === 'number') return instant
  if (typeof instant === 'string') return Date.parse(instant)
  return instant.getTime()
}

/** 01:00 UTC on the last Sunday of the month. */
function lastSundaySwitch(year: number, month: number): number {
  const lastDay = new Date(Date.UTC(year, month + 1, 0))
  const sunday = lastDay.getUTCDate() - lastDay.getUTCDay()
  return Date.UTC(year, month, sunday, SWITCH_HOUR_UTC)
}

/** Minutes the gym clock is ahead of UTC at that moment: 0 in winter, 60 in summer. */
export function gymOffsetMinutes(instant: Instant): number {
  const ms = toMs(instant)
  const year = new Date(ms).getUTCFullYear()
  const summer = ms >= lastSundaySwitch(year, MARCH) && ms < lastSundaySwitch(year, OCTOBER)
  return summer ? SUMMER_OFFSET_MINUTES : 0
}

/** The gym clock as UTC fields (read with getUTC*). */
function gymClock(instant: Instant): Date {
  const ms = toMs(instant)
  return new Date(ms + gymOffsetMinutes(ms) * MINUTE_MS)
}

function utcDayMs(date: GymDate): number {
  const m = DATE_PATTERN.exec(date)
  if (!m) throw new RangeError(`Invalid gym date: ${date}`)
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

function fromUtcDayMs(ms: number): GymDate {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function isValidGymDate(value: string): boolean {
  return DATE_PATTERN.test(value) && fromUtcDayMs(utcDayMs(value)) === value
}

/** The gym's calendar day at that moment. */
export function toGymDate(instant: Instant): GymDate {
  const clock = gymClock(instant)
  return fromUtcDayMs(Date.UTC(clock.getUTCFullYear(), clock.getUTCMonth(), clock.getUTCDate()))
}

/** Minutes since midnight on the gym clock. */
export function gymMinutesOfDay(instant: Instant): number {
  const clock = gymClock(instant)
  return clock.getUTCHours() * 60 + clock.getUTCMinutes()
}

/** 'HH:MM' → minutes since midnight, or null if it is not a valid time. */
export function parseGymTime(time: string): number | null {
  const m = TIME_PATTERN.exec(time)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/**
 * A gym wall-clock time → epoch ms. When the clock goes back (an hour happens twice) the first one wins;
 * when it jumps forward (an hour does not exist) the time moves one hour later, as the clock does.
 */
export function gymTimeToMs(date: GymDate, minutesOfDay: number): number {
  const wall = utcDayMs(date) + minutesOfDay * MINUTE_MS
  const asSummer = wall - SUMMER_OFFSET_MINUTES * MINUTE_MS
  if (gymOffsetMinutes(asSummer) === SUMMER_OFFSET_MINUTES) return asSummer
  return wall
}

export function addGymDays(date: GymDate, days: number): GymDate {
  return fromUtcDayMs(utcDayMs(date) + days * DAY_MS)
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function diffGymDays(from: GymDate, to: GymDate): number {
  return Math.round((utcDayMs(to) - utcDayMs(from)) / DAY_MS)
}

/** 1 = Monday … 7 = Sunday. */
export function gymWeekday(date: GymDate): number {
  return new Date(utcDayMs(date)).getUTCDay() || DAYS_PER_WEEK
}

export function gymMonday(date: GymDate): GymDate {
  return addGymDays(date, 1 - gymWeekday(date))
}

/** Monday to Sunday of the week that holds `date`. */
export function gymWeekDates(date: GymDate): GymDate[] {
  const monday = gymMonday(date)
  return Array.from({ length: DAYS_PER_WEEK }, (_, i) => addGymDays(monday, i))
}

/** The gym week that holds that moment, with its exact start and end. */
export function gymWeekOf(instant: Instant): GymWeek {
  const monday = gymMonday(toGymDate(instant))
  return {
    monday,
    startsAt: gymTimeToMs(monday, 0),
    endsAt: gymTimeToMs(addGymDays(monday, DAYS_PER_WEEK), 0),
  }
}

export function isSameGymWeek(a: Instant, b: Instant): boolean {
  return gymWeekOf(a).monday === gymWeekOf(b).monday
}
