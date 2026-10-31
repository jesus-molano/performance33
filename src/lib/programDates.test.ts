import { describe, expect, it } from 'vitest'
import { applyProgramDates, nextBlockStart } from './programDates'

const base = { startDate: '2026-10-05', endDate: '2026-11-01', weeks: 4 }

describe('applyProgramDates', () => {
  it('recomputes the end date from weeks', () => {
    expect(applyProgramDates(base, { weeks: 6 })).toEqual({ startDate: '2026-10-05', weeks: 6, endDate: '2026-11-15' })
  })

  it('recomputes weeks from a hand-set end date', () => {
    expect(applyProgramDates(base, { endDate: '2026-11-03' })).toEqual({ startDate: '2026-10-05', endDate: '2026-11-03', weeks: 5 })
  })

  it('moves the whole block when only the start changes, keeping a custom length', () => {
    const custom = { startDate: '2026-10-01', endDate: '2026-10-30', weeks: 5 }
    expect(applyProgramDates(custom, { startDate: '2026-10-11' })).toEqual({ startDate: '2026-10-11', endDate: '2026-11-09', weeks: 5 })
  })

  it('never lets the end date fall before the start', () => {
    expect(applyProgramDates(base, { endDate: '2026-09-01' }).endDate).toBe('2026-10-05')
  })
})

describe('nextBlockStart', () => {
  it('starts the day after the previous block, or today if that is past', () => {
    expect(nextBlockStart({ endDate: '2026-11-10' }, '2026-10-31')).toBe('2026-11-11')
    expect(nextBlockStart({ endDate: '2026-10-01' }, '2026-10-31')).toBe('2026-10-31')
  })
})
