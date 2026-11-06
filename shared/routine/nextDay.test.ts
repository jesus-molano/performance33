import { describe, expect, it } from 'vitest'
import { nextRoutineDay, type RoutineShape } from './nextDay.ts'

const TODAY = '2026-11-06'
const YESTERDAY = '2026-11-05'
const routine: RoutineShape = { id: 'p1', dayIds: ['d1', 'd2', 'd3'] }
const last = (dayId: string | null, dayNumber: number, gymDate = YESTERDAY, programId = 'p1') => ({ gymDate, programId, dayId, dayNumber })

describe('nextRoutineDay', () => {
  it('starts at Día 1 when nothing was done yet', () => {
    expect(nextRoutineDay(routine, null, TODAY)).toEqual({ day: 1, reason: 'first' })
  })

  it('a new routine starts at Día 1, whatever was done in the one before', () => {
    expect(nextRoutineDay(routine, last('x2', 2, YESTERDAY, 'old'), TODAY)).toEqual({ day: 1, reason: 'first' })
  })

  it('after a day comes the next one', () => {
    expect(nextRoutineDay(routine, last('d1', 1), TODAY)).toEqual({ day: 2, reason: 'next' })
    expect(nextRoutineDay(routine, last('d2', 2, '2026-10-20'), TODAY)).toEqual({ day: 3, reason: 'next' })
  })

  it('after the last day, back to Día 1', () => {
    expect(nextRoutineDay(routine, last('d3', 3), TODAY)).toEqual({ day: 1, reason: 'cycle' })
  })

  it('already trained today: the same day again', () => {
    expect(nextRoutineDay(routine, last('d2', 2, TODAY), TODAY)).toEqual({ day: 2, reason: 'today' })
  })

  it('follows the day by its id when the days were reordered', () => {
    const reordered = { id: 'p1', dayIds: ['d2', 'd1', 'd3'] }
    expect(nextRoutineDay(reordered, last('d2', 2), TODAY)).toEqual({ day: 2, reason: 'next' })
    expect(nextRoutineDay(reordered, last('d2', 2, TODAY), TODAY)).toEqual({ day: 1, reason: 'today' })
  })

  it('a day removed since: next is the day that took its place', () => {
    const without2 = { id: 'p1', dayIds: ['d1', 'd3'] }
    expect(nextRoutineDay(without2, last('d2', 2), TODAY)).toEqual({ day: 2, reason: 'next' })
    expect(nextRoutineDay(without2, last('d2', 2, TODAY), TODAY)).toEqual({ day: 2, reason: 'today' })
  })

  it('the last day removed since: back to Día 1, and today the new last one', () => {
    const without3 = { id: 'p1', dayIds: ['d1', 'd2'] }
    expect(nextRoutineDay(without3, last('d3', 3), TODAY)).toEqual({ day: 1, reason: 'cycle' })
    expect(nextRoutineDay(without3, last('d3', 3, TODAY), TODAY)).toEqual({ day: 2, reason: 'today' })
    expect(nextRoutineDay(without3, last(null, 7), TODAY)).toEqual({ day: 1, reason: 'cycle' })
  })

  it('a one-day routine is always Día 1', () => {
    const single = { id: 'p1', dayIds: ['d1'] }
    expect(nextRoutineDay(single, last('d1', 1), TODAY)).toEqual({ day: 1, reason: 'cycle' })
  })

  it('nothing for a routine without days, or no routine', () => {
    expect(nextRoutineDay({ id: 'p1', dayIds: [] }, null, TODAY)).toBeNull()
    expect(nextRoutineDay(null, last('d1', 1), TODAY)).toBeNull()
  })
})
