import { describe, expect, it } from 'vitest'
import { calendarDays, isInMonth, monthOf, shiftMonth } from './calendar'
import { parseISODate } from './dates'

describe('calendarDays', () => {
  it('starts on a Monday and ends on a Sunday', () => {
    const days = calendarDays({ year: 2026, month: 9 })
    expect(days[0]).toBe('2026-09-28')
    expect(parseISODate(days[0]).getDay()).toBe(1)
    expect(parseISODate(days.at(-1) ?? '').getDay()).toBe(0)
    expect(days.at(-1)).toBe('2026-11-01')
  })

  it('needs no leading days when the month starts on a Monday', () => {
    expect(calendarDays({ year: 2026, month: 5 })[0]).toBe('2026-06-01')
  })

  it('draws whole weeks, also for a four-week February', () => {
    expect(calendarDays({ year: 2027, month: 1 })).toHaveLength(28)
    expect(calendarDays({ year: 2026, month: 7 }).length % 7).toBe(0)
  })
})

describe('months', () => {
  it('cross the year in both directions', () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 })
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 })
  })

  it('know their days', () => {
    expect(monthOf('2026-10-31')).toEqual({ year: 2026, month: 9 })
    expect(isInMonth('2026-10-31', { year: 2026, month: 9 })).toBe(true)
    expect(isInMonth('2026-11-01', { year: 2026, month: 9 })).toBe(false)
  })
})
