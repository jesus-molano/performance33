import { describe, expect, it } from 'vitest'
import { MAX_PROGRAM_WEEKS } from '@/config/app'
import { endDateFor } from './dates'
import { applyProgramDates } from './programDates'

const current = { startDate: '2026-11-02', endDate: '2026-11-29', weeks: 4 }

describe('applyProgramDates with a typed end date', () => {
  it('recalculates the weeks', () => {
    expect(applyProgramDates(current, { endDate: '2026-12-13' })).toEqual({ startDate: '2026-11-02', endDate: '2026-12-13', weeks: 6 })
  })

  it('never goes before the start', () => {
    expect(applyProgramDates(current, { endDate: '2026-10-01' }).endDate).toBe('2026-11-02')
  })

  it('a year typo cannot make a routine longer than the maximum', () => {
    const result = applyProgramDates(current, { endDate: '2062-11-03' })
    expect(result.weeks).toBe(MAX_PROGRAM_WEEKS)
    expect(result.endDate).toBe(endDateFor('2026-11-02', MAX_PROGRAM_WEEKS))
  })
})
