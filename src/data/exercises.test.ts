import { describe, expect, it } from 'vitest'
import { EXERCISE_TYPES, MUSCLE_GROUPS, SECONDARY_MUSCLE_CHOICES } from '@/config/exerciseTags'
import { EXERCISE_LIBRARY, EXERCISES_ADDED_IN_V2 } from './exercises'

/** Fewer than this in a group and a coach would not find anything to choose from. */
const MIN_EXERCISES_PER_GROUP = 6

describe('EXERCISE_LIBRARY', () => {
  it('has unique ids', () => {
    const ids = EXERCISE_LIBRARY.map((exercise) => exercise.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique names', () => {
    const names = EXERCISE_LIBRARY.map((exercise) => exercise.name.toLowerCase())
    expect(new Set(names).size).toBe(names.length)
  })

  it('uses only valid tags', () => {
    for (const { id, muscle, secondaryMuscles = [], type } of EXERCISE_LIBRARY) {
      expect(MUSCLE_GROUPS, id).toContain(muscle)
      expect(EXERCISE_TYPES, id).toContain(type)
      expect(new Set(secondaryMuscles).size, id).toBe(secondaryMuscles.length)
      expect(secondaryMuscles, id).not.toContain(muscle)
      for (const secondary of secondaryMuscles) expect(SECONDARY_MUSCLE_CHOICES, id).toContain(secondary)
    }
  })

  it.each(MUSCLE_GROUPS)('has enough exercises with %s as the main muscle', (muscle) => {
    expect(EXERCISE_LIBRARY.filter((exercise) => exercise.muscle === muscle).length).toBeGreaterThanOrEqual(MIN_EXERCISES_PER_GROUP)
  })

  it.each(EXERCISE_TYPES)('has exercises of type %s', (type) => {
    expect(EXERCISE_LIBRARY.filter((exercise) => exercise.type === type).length).toBeGreaterThanOrEqual(MIN_EXERCISES_PER_GROUP)
  })

  it('every exercise added later exists', () => {
    const ids = new Set(EXERCISE_LIBRARY.map((exercise) => exercise.id))
    for (const id of EXERCISES_ADDED_IN_V2) expect(ids, id).toContain(id)
  })
})
