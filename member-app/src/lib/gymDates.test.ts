import { describe, expect, it } from 'vitest'
import { dayChipParts, formatDayLabel, formatGymDate, formatGymTime, formatMinutesSpan, upcomingGymDays } from './gymDates'

describe('gym dates', () => {
  it('reads times on the Canary clock, summer and winter', () => {
    expect(formatGymTime('2026-07-01T17:00:00Z')).toBe('18:00')
    expect(formatGymTime('2026-11-09T18:00:00Z')).toBe('18:00')
  })

  it('names days for the member', () => {
    expect(formatGymDate('2026-11-09')).toBe('Lun 9 nov')
    expect(formatDayLabel('2026-11-06', '2026-11-06')).toBe('Hoy')
    expect(formatDayLabel('2026-11-07', '2026-11-06')).toBe('Mañana')
    expect(formatDayLabel('2026-11-09', '2026-11-06')).toBe('Lun 9 nov')
    expect(dayChipParts('2026-11-15')).toEqual({ weekday: 'Dom', day: 15 })
  })

  it('writes spans of minutes', () => {
    expect(formatMinutesSpan(45)).toBe('45 min')
    expect(formatMinutesSpan(120)).toBe('2 h')
    expect(formatMinutesSpan(90)).toBe('1 h 30 min')
  })

  it('lists today and the days ahead', () => {
    expect(upcomingGymDays('2026-12-30', 3)).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02'])
  })
})
