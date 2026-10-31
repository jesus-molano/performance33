import { describe, expect, it } from 'vitest'
import { copiedDayName, renumberDays } from './days'
import { createDay } from './factories'

describe('renumberDays', () => {
  it('renames automatic names to their position and keeps custom ones', () => {
    const days = [createDay(2), createDay(0, { name: 'Pierna fuerte' }), createDay(0)]
    expect(renumberDays(days).map((d) => d.name)).toEqual(['Día 1', 'Pierna fuerte', 'Día 3'])
  })

  it('treats copies of automatic days as automatic', () => {
    expect(copiedDayName({ name: 'Día 2' })).toBe('Día 2')
    expect(copiedDayName({ name: 'Empuje' })).toBe('Empuje (copia)')
    expect(renumberDays([createDay(0), createDay(0, { name: 'Día 1 (copia)' })]).map((d) => d.name)).toEqual(['Día 1', 'Día 2'])
  })
})
