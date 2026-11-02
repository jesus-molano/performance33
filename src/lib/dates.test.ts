import { describe, expect, it } from 'vitest'
import { formatDate, formatDateRange, formatDateTime, formatDateWithWeekday, formatMonthYear, toISODate } from './dates'

describe('displayed dates', () => {
  it('are always dd/mm/aaaa', () => {
    expect(formatDate('2026-10-03')).toBe('03/10/2026')
    expect(formatDateRange('2026-10-27', '2026-11-23')).toBe('27/10/2026 – 23/11/2026')
  })

  it('name the weekday and the month in Spanish', () => {
    expect(formatDateWithWeekday('2026-10-31')).toBe('sábado, 31 de octubre')
    expect(formatMonthYear(2026, 9)).toBe('octubre de 2026')
  })

  it('say today and yesterday, and the full date before that', () => {
    const at = (daysAgo: number) => {
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      date.setHours(9, 5)
      return date
    }
    expect(formatDateTime(at(0).toISOString())).toBe('hoy, 09:05')
    expect(formatDateTime(at(1).toISOString())).toBe('ayer, 09:05')
    expect(formatDateTime(at(5).toISOString())).toBe(`${formatDate(toISODate(at(5)))}, 09:05`)
    expect(formatDateTime('no es una fecha')).toBe('')
  })
})
