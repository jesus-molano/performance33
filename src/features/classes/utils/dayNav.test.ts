import { describe, expect, it } from 'vitest'
import { resolveClassDay, weekStrip } from './dayNav'

describe('day navigation', () => {
  it('uses the address day only when it is a real date', () => {
    expect(resolveClassDay('2026-11-10', '2026-11-06')).toBe('2026-11-10')
    expect(resolveClassDay(null, '2026-11-06')).toBe('2026-11-06')
    expect(resolveClassDay('2026-02-30', '2026-11-06')).toBe('2026-11-06')
    expect(resolveClassDay('mañana', '2026-11-06')).toBe('2026-11-06')
  })

  it('lays out Monday to Sunday with today and the picked day marked', () => {
    const strip = weekStrip('2026-11-06', '2026-11-05')
    expect(strip.map((d) => d.letter).join('')).toBe('LMXJVSD')
    expect(strip[0]).toMatchObject({ date: '2026-11-02', dayOfMonth: 2, isToday: false, isSelected: false })
    expect(strip[3].isToday).toBe(true)
    expect(strip[4].isSelected).toBe(true)
    expect(strip[6].date).toBe('2026-11-08')
  })
})
