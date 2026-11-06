import { describe, expect, it } from 'vitest'
import { GYM_TIME_ZONE } from './constants.ts'
import {
  addGymDays,
  diffGymDays,
  gymMinutesOfDay,
  gymMonday,
  gymOffsetMinutes,
  gymTimeToMs,
  gymWeekDates,
  gymWeekday,
  gymWeekOf,
  isSameGymWeek,
  isValidGymDate,
  parseGymTime,
  toGymDate,
} from './week.ts'

const utc = (iso: string) => Date.parse(iso)

/** What Intl says the gym's wall clock reads, to check the hand-made rule against the real zone data. */
function intlGymClock(ms: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: GYM_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(ms)
  const get = (type: string) => parts.find((p) => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`
}

function ownGymClock(ms: number): string {
  const minutes = gymMinutesOfDay(ms)
  return `${toGymDate(ms)} ${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

describe('gym clock (Atlantic/Canary)', () => {
  it('is UTC+0 in winter and UTC+1 in summer', () => {
    expect(gymOffsetMinutes(utc('2026-01-15T12:00:00Z'))).toBe(0)
    expect(gymOffsetMinutes(utc('2026-07-15T12:00:00Z'))).toBe(60)
  })

  it('switches at 01:00 UTC on 2026-03-29 and 2026-10-25', () => {
    expect(gymOffsetMinutes(utc('2026-03-29T00:59:59Z'))).toBe(0)
    expect(gymOffsetMinutes(utc('2026-03-29T01:00:00Z'))).toBe(60)
    expect(gymOffsetMinutes(utc('2026-10-25T00:59:59Z'))).toBe(60)
    expect(gymOffsetMinutes(utc('2026-10-25T01:00:00Z'))).toBe(0)
  })

  it('matches the real zone data every 30 minutes around both changes and across years', () => {
    const starts = ['2026-03-28T00:00:00Z', '2026-10-24T00:00:00Z', '2027-03-27T00:00:00Z', '2030-10-26T00:00:00Z']
    for (const start of starts) {
      for (let step = 0; step < 96; step++) {
        const ms = utc(start) + step * 30 * 60_000
        expect(ownGymClock(ms)).toBe(intlGymClock(ms))
      }
    }
  })

  it('reads ISO timestamps with an offset, as Postgres sends them', () => {
    expect(toGymDate('2026-11-01T23:30:00+00:00')).toBe('2026-11-01')
    expect(toGymDate('2026-08-02T23:30:00+00:00')).toBe('2026-08-03')
    expect(gymMinutesOfDay(new Date('2026-08-02T23:30:00Z'))).toBe(30)
  })
})

describe('gymTimeToMs', () => {
  it('turns a wall-clock time into the exact moment in winter and summer', () => {
    expect(gymTimeToMs('2026-01-12', 9 * 60)).toBe(utc('2026-01-12T09:00:00Z'))
    expect(gymTimeToMs('2026-07-13', 9 * 60)).toBe(utc('2026-07-13T08:00:00Z'))
  })

  it('handles the day the clock jumps forward (2026-03-29)', () => {
    expect(gymTimeToMs('2026-03-29', 0)).toBe(utc('2026-03-29T00:00:00Z'))
    expect(gymTimeToMs('2026-03-29', 90)).toBe(utc('2026-03-29T01:30:00Z'))
    expect(gymTimeToMs('2026-03-29', 2 * 60)).toBe(utc('2026-03-29T01:00:00Z'))
    expect(gymTimeToMs('2026-03-29', 9 * 60)).toBe(utc('2026-03-29T08:00:00Z'))
  })

  it('handles the day the clock goes back (2026-10-25), taking the first 01:30', () => {
    expect(gymTimeToMs('2026-10-25', 0)).toBe(utc('2026-10-24T23:00:00Z'))
    expect(gymTimeToMs('2026-10-25', 90)).toBe(utc('2026-10-25T00:30:00Z'))
    expect(gymTimeToMs('2026-10-25', 9 * 60)).toBe(utc('2026-10-25T09:00:00Z'))
  })

  it('round-trips with the gym clock', () => {
    const ms = gymTimeToMs('2026-10-26', 18 * 60 + 15)
    expect(toGymDate(ms)).toBe('2026-10-26')
    expect(gymMinutesOfDay(ms)).toBe(18 * 60 + 15)
  })
})

describe('calendar days', () => {
  it('validates dates and times', () => {
    expect(isValidGymDate('2026-02-28')).toBe(true)
    expect(isValidGymDate('2026-02-29')).toBe(false)
    expect(isValidGymDate('2026-2-1')).toBe(false)
    expect(parseGymTime('07:05')).toBe(425)
    expect(parseGymTime('24:00')).toBeNull()
    expect(parseGymTime('7:05')).toBeNull()
  })

  it('adds and counts days across the changes and month ends', () => {
    expect(addGymDays('2026-03-28', 2)).toBe('2026-03-30')
    expect(addGymDays('2026-10-25', -1)).toBe('2026-10-24')
    expect(addGymDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(diffGymDays('2026-03-23', '2026-03-30')).toBe(7)
    expect(diffGymDays('2026-10-26', '2026-10-19')).toBe(-7)
  })

  it('numbers the weekdays from Monday (1) to Sunday (7)', () => {
    expect(gymWeekday('2026-03-23')).toBe(1)
    expect(gymWeekday('2026-03-29')).toBe(7)
    expect(gymMonday('2026-03-29')).toBe('2026-03-23')
    expect(gymMonday('2026-03-30')).toBe('2026-03-30')
  })

  it('lists Monday to Sunday', () => {
    expect(gymWeekDates('2026-10-22')).toEqual([
      '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25',
    ])
  })
})

describe('gym weeks', () => {
  it('the week of the spring change is one hour shorter', () => {
    const week = gymWeekOf(utc('2026-03-29T12:00:00Z'))
    expect(week.monday).toBe('2026-03-23')
    expect(week.startsAt).toBe(utc('2026-03-23T00:00:00Z'))
    expect(week.endsAt).toBe(utc('2026-03-29T23:00:00Z'))
  })

  it('the week of the autumn change is one hour longer', () => {
    const week = gymWeekOf(utc('2026-10-25T12:00:00Z'))
    expect(week.monday).toBe('2026-10-19')
    expect(week.startsAt).toBe(utc('2026-10-18T23:00:00Z'))
    expect(week.endsAt).toBe(utc('2026-10-26T00:00:00Z'))
  })

  it('Sunday 23:30 and Monday 00:30 gym time are different weeks, in summer and in winter', () => {
    expect(isSameGymWeek(utc('2026-08-02T22:30:00Z'), utc('2026-08-02T23:30:00Z'))).toBe(false)
    expect(isSameGymWeek(utc('2026-11-01T23:30:00Z'), utc('2026-11-02T00:30:00Z'))).toBe(false)
    expect(isSameGymWeek(utc('2026-11-02T00:30:00Z'), utc('2026-11-08T23:30:00Z'))).toBe(true)
  })

  it('a UTC Sunday night in summer is already Monday in the gym', () => {
    expect(gymWeekOf(utc('2026-08-02T23:30:00Z')).monday).toBe('2026-08-03')
  })
})
