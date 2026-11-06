import { describe, expect, it } from 'vitest'
import { DEFAULT_SCREEN_DAY, pickedScreenDay, screenDayOptions } from './screenDays'

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
