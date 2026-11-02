import { describe, expect, it } from 'vitest'
import type { AnyLibraryExercise, ExerciseCategory } from '@/types'
import { collectEquipment, EMPTY_EXERCISE_FILTERS, exerciseSearchUrl, filterExercises } from './exerciseLibrary'

function exercise(name: string, category: ExerciseCategory, equipment: string[], custom = false): AnyLibraryExercise {
  const base = { id: name, name, category, equipment, defaultMeasure: 'reps' as const }
  return custom ? { ...base, custom: true } : base
}

const LIBRARY = [
  exercise('Remo con barra', 'Tracción', ['Barra']),
  exercise('Ábdominal rueda', 'Core', ['Rueda'], true),
  exercise('Sentadilla goblet', 'Piernas', ['Kettlebell', 'Mancuernas']),
  exercise('Zancada', 'Piernas', ['Mancuernas']),
]

const names = (list: AnyLibraryExercise[]) => list.map((e) => e.name)

describe('filterExercises', () => {
  it('lists everything A–Z when just browsing, ignoring accents', () => {
    expect(names(filterExercises(LIBRARY, EMPTY_EXERCISE_FILTERS))).toEqual(['Ábdominal rueda', 'Remo con barra', 'Sentadilla goblet', 'Zancada'])
  })

  it('does not reorder the library it receives', () => {
    filterExercises(LIBRARY, EMPTY_EXERCISE_FILTERS)
    expect(LIBRARY[0].name).toBe('Remo con barra')
  })

  it('combines category, material and scope', () => {
    expect(names(filterExercises(LIBRARY, { ...EMPTY_EXERCISE_FILTERS, category: 'Piernas' }))).toEqual(['Sentadilla goblet', 'Zancada'])
    expect(names(filterExercises(LIBRARY, { ...EMPTY_EXERCISE_FILTERS, equipment: 'Kettlebell' }))).toEqual(['Sentadilla goblet'])
    expect(names(filterExercises(LIBRARY, { ...EMPTY_EXERCISE_FILTERS, scope: 'custom' }))).toEqual(['Ábdominal rueda'])
  })

  it('searches only inside the filtered exercises', () => {
    const filters = { ...EMPTY_EXERCISE_FILTERS, query: 'sentadilla' }
    expect(names(filterExercises(LIBRARY, filters))).toEqual(['Sentadilla goblet'])
    expect(filterExercises(LIBRARY, { ...filters, equipment: 'Barra' })).toEqual([])
  })
})

describe('collectEquipment', () => {
  it('returns each material once, sorted', () => {
    expect(collectEquipment(LIBRARY)).toEqual(['Barra', 'Kettlebell', 'Mancuernas', 'Rueda'])
  })
})

describe('exerciseSearchUrl', () => {
  it('searches the name plus the word ejercicio, encoded', () => {
    expect(exerciseSearchUrl('Press banca')).toBe('https://www.google.com/search?q=Press%20banca%20ejercicio')
    expect(exerciseSearchUrl('  Clean & jerk ñ ')).toBe('https://www.google.com/search?q=Clean%20%26%20jerk%20%C3%B1%20ejercicio')
  })

  it('has no link without a name', () => {
    expect(exerciseSearchUrl('')).toBeNull()
    expect(exerciseSearchUrl('   ')).toBeNull()
  })
})
