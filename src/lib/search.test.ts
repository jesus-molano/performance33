import { describe, expect, it } from 'vitest'
import { EXERCISE_LIBRARY } from '@/data/exercises'
import { normalizeText, searchExercises } from './search'

const names = (query: string) => searchExercises(query, EXERCISE_LIBRARY).map((r) => r.exercise.name)

describe('searchExercises', () => {
  it('ignores accents and case', () => {
    expect(normalizeText('Tracción ÁÉÍ')).toBe(normalizeText('traccion aei'))
    expect(names('SENTADILLA')).toContain('Sentadilla goblet')
  })

  it('finds exercises by alias', () => {
    expect(names('goblet squat')).toContain('Sentadilla goblet')
  })

  it('tolerates small typos', () => {
    expect(names('sentadila')).toContain('Sentadilla goblet')
  })
})
