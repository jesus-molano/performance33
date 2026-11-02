import { describe, expect, it } from 'vitest'
import { EXERCISE_LIBRARY } from '@/data/exercises'
import { findSimilarExercises, normalizeText, searchExercises } from './search'

const names = (query: string) => searchExercises(query, EXERCISE_LIBRARY).map((r) => r.exercise.name)
const searchAll = (query: string) => searchExercises(query, EXERCISE_LIBRARY, EXERCISE_LIBRARY.length).map((r) => r.exercise.name)
const muscles = (query: string) => [...new Set(searchExercises(query, EXERCISE_LIBRARY).map((r) => r.exercise.muscle))]

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

  it('a muscle finds its exercises before names that only mention it', () => {
    const results = searchExercises('pecho', EXERCISE_LIBRARY, 8).map((r) => r.exercise)
    expect(results[0].muscle).toBe('Pecho')
    expect(results.map((exercise) => exercise.name)).not.toContain('Chest to bar')
    expect(results.filter((exercise) => exercise.muscle === 'Pecho').length).toBeGreaterThanOrEqual(7)
    expect(searchExercises('pecho', EXERCISE_LIBRARY, 400).map((r) => r.exercise.name)).toContain('Press banca')
  })

  it('finds by other words for a muscle, with or without accents', () => {
    expect(muscles('Glúteos')).toEqual(['Glúteo'])
    expect(muscles('isquios')).toEqual(['Femoral'])
    expect(muscles('dorsal')[0]).toBe('Espalda')
    expect(muscles('biceps')).toEqual(['Bíceps'])
  })

  it('also finds by secondary muscle and by type, after the main ones', () => {
    expect(searchAll('triceps')).toContain('Press banca')
    expect(searchAll('triceps').indexOf('Press francés')).toBeLessThan(searchAll('triceps').indexOf('Press banca'))
    expect(searchAll('calentamiento')).toContain('Jumping jacks')
  })

  it('broad words and old categories still work', () => {
    expect(searchAll('piernas')).toContain('Prensa de piernas')
    expect(searchAll('piernas')).toContain('Curl nórdico')
    expect(searchAll('traccion')).toContain('Remo con barra')
  })

  it('mixes a muscle with a word of the name or the material', () => {
    expect(searchAll('press pecho')).toContain('Press banca')
    expect(searchAll('pecho mancuernas')).toContain('Aperturas con mancuernas')
    expect(searchAll('pecho mancuernas')).not.toContain('Press banca')
  })

  it('keeps names first when the word is a name', () => {
    expect(names('remo')[0]).toContain('Remo')
    expect(names('curl').every((name) => name.startsWith('Curl'))).toBe(true)
  })

  it('needs three letters to look at the tags', () => {
    expect(searchExercises('co', [EXERCISE_LIBRARY.find((e) => e.id === 'dead-bug')!])).toEqual([])
  })
})

describe('findSimilarExercises', () => {
  it('only looks at names: a muscle is not a duplicate', () => {
    expect(findSimilarExercises('Pecho', EXERCISE_LIBRARY).every((exercise) => /pecho/i.test(exercise.name) || exercise.aliases?.some((alias) => /pecho/i.test(alias)))).toBe(true)
    expect(findSimilarExercises('Glúteos', EXERCISE_LIBRARY)).toEqual([])
  })
})
