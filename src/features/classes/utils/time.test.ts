import { gymTimeToMs } from '@shared/booking'
import { describe, expect, it } from 'vitest'
import { classTimeOptions, formatGymDay, formatGymDayShort, formatGymTime, formatLeadTime, relativeDayName, slotTimeRange } from './time'

describe('class times', () => {
  it('reads times on the gym clock, in winter and in summer', () => {
    expect(formatGymTime(Date.UTC(2026, 10, 6, 18))).toBe('18:00')
    expect(formatGymTime(Date.UTC(2026, 6, 6, 17, 30))).toBe('18:30')
  })

  it('shows a class as a range', () => {
    expect(slotTimeRange({ startsAt: gymTimeToMs('2026-11-06', 18 * 60), durationMinutes: 60 })).toBe('18:00–19:00')
    expect(slotTimeRange({ startsAt: gymTimeToMs('2026-11-06', 7 * 60 + 30), durationMinutes: 45 })).toBe('07:30–08:15')
  })

  it('names days', () => {
    expect(formatGymDay('2026-11-06')).toBe('viernes 6 nov')
    expect(formatGymDayShort('2026-11-09')).toBe('lun 9/11')
    expect(relativeDayName('2026-11-06', '2026-11-06')).toBe('Hoy')
    expect(relativeDayName('2026-11-07', '2026-11-06')).toBe('Mañana')
    expect(relativeDayName('2026-11-05', '2026-11-06')).toBe('Ayer')
    expect(relativeDayName('2026-11-10', '2026-11-06')).toBeNull()
  })

  it('offers start times every 15 minutes, plus one saved outside the steps', () => {
    const options = classTimeOptions()
    expect(options[0]).toBe(300)
    expect(options.at(-1)).toBe(1380)
    expect(options[1] - options[0]).toBe(15)
    expect(classTimeOptions(7 * 60 + 10)).toContain(430)
  })

  it('words lead times', () => {
    expect(formatLeadTime(0)).toBe('')
    expect(formatLeadTime(30)).toBe('30 min')
    expect(formatLeadTime(120)).toBe('2 h')
    expect(formatLeadTime(90)).toBe('1 h 30 min')
    expect(formatLeadTime(1440)).toBe('1 día')
    expect(formatLeadTime(2880)).toBe('2 días')
  })
})
