import { describe, expect, it } from 'vitest'
import { DEFAULT_SCREEN_DAY, initialScreenDay, pickedScreenDay, screenDayOptions, shownScreenDay } from './screenDays'

const days = [
  { name: 'Día 1', label: 'Pierna' },
  { name: 'Día 2', label: '' },
  { name: 'Lunes', label: ' Empuje ' },
]

describe('screenDayOptions', () => {
  it('numbers the days from 1 and labels them like the rest of the app', () => {
    expect(screenDayOptions(days)).toEqual([
      { day: 1, label: 'Día 1 · Pierna' },
      { day: 2, label: 'Día 2' },
      { day: 3, label: 'Lunes · Empuje' },
    ])
  })

  it('gives nothing for a routine without days', () => {
    expect(screenDayOptions([])).toEqual([])
  })
})

describe('pickedScreenDay', () => {
  const options = screenDayOptions(days)

  it('starts on Día 1', () => {
    expect(pickedScreenDay(options, DEFAULT_SCREEN_DAY)?.day).toBe(1)
  })

  it('keeps the chosen day', () => {
    expect(pickedScreenDay(options, 3)).toEqual({ day: 3, label: 'Lunes · Empuje' })
  })

  it('falls back to the first day when the chosen one is gone', () => {
    expect(pickedScreenDay(options, 7)?.day).toBe(1)
  })

  it('is null without days', () => {
    expect(pickedScreenDay([], 1)).toBeNull()
  })
})

describe('shownScreenDay', () => {
  const section = (clientId: string | null, day: number, assignedAt = '') => ({ clientId, day, assignedAt })
  const screens = [
    { contents: [section('laura', 2, '2026-11-06T10:00:00Z'), section(null, 1)] },
    { contents: [section('marta', 3, '2026-11-06T09:00:00Z'), section('laura', 1, '2026-11-06T08:00:00Z')] },
  ]

  it('is the day she shows now, from the section sent to last', () => {
    expect(shownScreenDay(screens, 'laura')).toBe(2)
    expect(shownScreenDay(screens, 'marta')).toBe(3)
  })

  it('is null when she is on no TV', () => {
    expect(shownScreenDay(screens, 'javier')).toBeNull()
    expect(shownScreenDay([], 'laura')).toBeNull()
  })
})

describe('initialScreenDay', () => {
  const options = screenDayOptions(days)

  it('starts on the day she shows on a TV, so moving her keeps it', () => {
    expect(initialScreenDay(options, 2)).toBe(2)
  })

  it('starts on Día 1 when she is on no TV, or that day no longer exists', () => {
    expect(initialScreenDay(options, null)).toBe(DEFAULT_SCREEN_DAY)
    expect(initialScreenDay(options, 7)).toBe(DEFAULT_SCREEN_DAY)
  })
})
