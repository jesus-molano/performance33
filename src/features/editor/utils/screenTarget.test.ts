import { describe, expect, it } from 'vitest'
import { dayScreenTarget } from './screenTarget'

const day = { name: 'Día 2', label: 'Pierna' }

describe('dayScreenTarget', () => {
  it('sends a day of the current routine with its 1-based number', () => {
    expect(dayScreenTarget({ id: 'c1', currentProgramId: 'p1' }, { id: 'p1' }, day, 1)).toEqual({
      clientId: 'c1',
      day: 2,
      dayLabel: 'Día 2 · Pierna',
    })
  })

  it('offers nothing for another routine (the TV shows the current one) or without a day', () => {
    expect(dayScreenTarget({ id: 'c1', currentProgramId: 'p2' }, { id: 'p1' }, day, 1)).toBeNull()
    expect(dayScreenTarget({ id: 'c1', currentProgramId: null }, { id: 'p1' }, day, 1)).toBeNull()
    expect(dayScreenTarget({ id: 'c1', currentProgramId: 'p1' }, { id: 'p1' }, null, 0)).toBeNull()
  })
})
