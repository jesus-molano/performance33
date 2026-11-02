import { describe, expect, it } from 'vitest'
import {
  EXERCISE_CUE_MAX_LENGTH,
  EXERCISE_NAME_MAX_LENGTH,
  MAX_DAYS_PER_PROGRAM,
  MAX_EXERCISES_PER_BLOCK,
} from '@/config/capacity'
import { EXERCISE_LIBRARY } from '@/data/exercises'
import { createSeedData } from '@/data/seed'
import {
  clampExerciseTexts,
  findAddExerciseRefusal,
  getAddBlockRefusal,
  getAddDayRefusal,
  getLengthHint,
  getAddExerciseRefusal,
  getDayCapacity,
  getDayChangeRefusal,
} from './capacity'

const block = (id: string, exercises: number) => ({ id, exercises: Array.from({ length: exercises }) })
const dayOf = (...sizes: number[]) => ({ blocks: sizes.map((size, i) => block(`b${i}`, size)) })

describe('getAddBlockRefusal', () => {
  it('allows blocks up to the limit', () => {
    expect(getAddBlockRefusal(dayOf(1, 1, 1, 1))).toBeNull()
    expect(getAddBlockRefusal(dayOf(1, 1, 1, 1, 1))).toBe('blocks')
  })

  it('refuses a block whose exercises overflow the day or the block', () => {
    expect(getAddBlockRefusal(dayOf(5, 5, 5, 1), 1)).toBe('dayExercises')
    expect(getAddBlockRefusal(dayOf(5, 5, 5, 1))).toBeNull()
    expect(getAddBlockRefusal(dayOf(1), MAX_EXERCISES_PER_BLOCK + 1)).toBe('blockExercises')
  })
})

describe('getAddExerciseRefusal', () => {
  it('stops at the block limit', () => {
    expect(getAddExerciseRefusal(dayOf(4), 'b0')).toBeNull()
    expect(getAddExerciseRefusal(dayOf(5), 'b0')).toBe('blockExercises')
  })

  it('stops at the day limit', () => {
    expect(getAddExerciseRefusal(dayOf(4, 4, 4, 3), 'b3')).toBeNull()
    expect(getAddExerciseRefusal(dayOf(4, 4, 4, 4), 'b3')).toBe('dayExercises')
  })

  it('finds the day of the block', () => {
    expect(findAddExerciseRefusal([dayOf(1), { blocks: [block('x', 5)] }], 'x')).toBe('blockExercises')
    expect(findAddExerciseRefusal([dayOf(1)], 'nope')).toBeNull()
  })
})

describe('data already over the limit', () => {
  const imported = dayOf(7, 7, 7, 1, 1, 1)

  it('cannot grow, but can stay the same or shrink', () => {
    expect(getAddBlockRefusal(imported)).toBe('blocks')
    expect(getAddExerciseRefusal(imported, 'b0')).toBe('blockExercises')
    expect(getAddExerciseRefusal(imported, 'b3')).toBe('dayExercises')
    expect(getDayChangeRefusal(imported, imported)).toBeNull()
    expect(getDayChangeRefusal(imported, dayOf(7, 7, 1, 1, 1))).toBeNull()
  })
})

describe('getDayCapacity', () => {
  it('turns near the limit and over it', () => {
    expect(getDayCapacity(dayOf(3, 3, 3)).level).toBe('ok')
    expect(getDayCapacity(dayOf(4, 4, 3, 3)).level).toBe('near')
    expect(getDayCapacity(dayOf(1, 1, 1, 1, 1)).level).toBe('near')
    expect(getDayCapacity(dayOf(1, 1, 1, 1, 1, 1)).level).toBe('over')
    expect(getDayCapacity(dayOf(6)).level).toBe('over')
    expect(getDayCapacity(dayOf(5, 5, 5, 2)).level).toBe('over')
  })

  it('counts and says why no block fits', () => {
    expect(getDayCapacity(dayOf(2, 3))).toEqual({ blocks: 2, exercises: 5, level: 'ok', addBlockRefusal: null })
    expect(getDayCapacity(dayOf(1, 1, 1, 1, 1)).addBlockRefusal).toBe('blocks')
  })

  it('handles an empty day', () => {
    expect(getDayCapacity({ blocks: [] })).toEqual({ blocks: 0, exercises: 0, level: 'ok', addBlockRefusal: null })
  })
})

describe('getLengthHint', () => {
  it('appears only close to the maximum', () => {
    expect(getLengthHint('a'.repeat(EXERCISE_NAME_MAX_LENGTH - 20), EXERCISE_NAME_MAX_LENGTH)).toBeNull()
    expect(getLengthHint('a'.repeat(EXERCISE_NAME_MAX_LENGTH), EXERCISE_NAME_MAX_LENGTH)).toContain(`${EXERCISE_NAME_MAX_LENGTH}/${EXERCISE_NAME_MAX_LENGTH}`)
  })
})

describe('clampExerciseTexts', () => {
  it('cuts only the texts that are too long', () => {
    const long = 'x'.repeat(200)
    const patch = { name: long, cue: long, load: long }
    const clamped = clampExerciseTexts(patch)
    expect(clamped.name).toHaveLength(EXERCISE_NAME_MAX_LENGTH)
    expect(clamped.cue).toHaveLength(EXERCISE_CUE_MAX_LENGTH)
    expect(clamped.load).toBe(long)
    const short = { name: 'Remo', load: '60' }
    expect(clampExerciseTexts(short)).toEqual(short)
  })
})

describe('limits against real content', () => {
  it('every library exercise fits the name limit', () => {
    for (const exercise of EXERCISE_LIBRARY) expect(exercise.name.length).toBeLessThanOrEqual(EXERCISE_NAME_MAX_LENGTH)
  })

  it('every demo day is within the limits', () => {
    for (const program of createSeedData('2026-10-31').programs) {
      for (const day of program.days) expect(getDayCapacity(day).level).not.toBe('over')
    }
  })
})

describe('getAddDayRefusal', () => {
  it('refuses at the maximum and above, never below', () => {
    expect(getAddDayRefusal(MAX_DAYS_PER_PROGRAM - 1)).toBeNull()
    expect(getAddDayRefusal(MAX_DAYS_PER_PROGRAM)).toBe('days')
    expect(getAddDayRefusal(MAX_DAYS_PER_PROGRAM + 1)).toBe('days')
  })
})
