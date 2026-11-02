import { describe, expect, it } from 'vitest'
import { EXERCISE_LIBRARY } from '@/data/exercises'
import { resolveExerciseTags } from './libraryTags'
import { normalizeLibraryExercise } from './migrate'

const INITIAL = new Map(EXERCISE_LIBRARY.map((exercise) => [exercise.id, exercise]))
const resolve = (raw: Record<string, unknown>, id = 'own', name = 'Propio') => resolveExerciseTags(raw, id, name, INITIAL)

describe('resolveExerciseTags', () => {
  it('an initial exercise takes its tags from the initial library', () => {
    expect(resolve({ category: 'Empuje' }, 'press-banca', 'Press banca')).toEqual({ muscle: 'Pecho', secondaryMuscles: ['Tríceps', 'Hombro'], type: 'Fuerza' })
    expect(resolve({ category: 'Cardio' }, 'comba', 'Comba')).toEqual({ muscle: 'Gemelo', type: 'Cardio' })
  })

  it('translates every old category of an exercise of their own', () => {
    expect(resolve({ category: 'Glúteo' })).toEqual({ muscle: 'Glúteo', type: 'Fuerza' })
    expect(resolve({ category: 'Tracción' })).toEqual({ muscle: 'Espalda', type: 'Fuerza' })
    expect(resolve({ category: 'Halterofilia' })).toEqual({ muscle: 'Cuerpo entero', type: 'Halterofilia' })
    expect(resolve({ category: 'Movilidad' })).toEqual({ muscle: 'Cuerpo entero', type: 'Movilidad' })
  })

  it('a wide old category listens to the name', () => {
    expect(resolve({ category: 'Brazos' }, 'own', 'Extensión de tríceps rara')).toEqual({ muscle: 'Tríceps', type: 'Fuerza' })
    expect(resolve({ category: 'Brazos' }, 'own', 'Curl con cuerda')).toEqual({ muscle: 'Bíceps', type: 'Fuerza' })
    expect(resolve({ category: 'Piernas' }, 'own', 'Gemelos a la pata coja')).toEqual({ muscle: 'Gemelo', type: 'Fuerza' })
    expect(resolve({ category: 'Piernas' }, 'own', 'Sentadilla rara')).toEqual({ muscle: 'Cuádriceps', type: 'Fuerza' })
  })

  it('without any category it guesses, or says whole body', () => {
    expect(resolve({}, 'own', 'Remo de espalda')).toEqual({ muscle: 'Espalda', type: 'Fuerza' })
    expect(resolve({ category: 'Inventada' })).toEqual({ muscle: 'Cuerpo entero', type: 'Fuerza' })
  })

  it('keeps what a coach chose, even on an initial exercise, and cleans the rest', () => {
    expect(resolve({ muscle: 'Hombro', type: 'Calentamiento', secondaryMuscles: ['Core'] }, 'press-banca')).toEqual({ muscle: 'Hombro', type: 'Calentamiento', secondaryMuscles: ['Core'] })
    expect(resolve({ muscle: 'Hombro', type: 'Otra', secondaryMuscles: ['Hombro', 'Core', 'Core', 'Nada', 'Cuerpo entero'] })).toEqual({ muscle: 'Hombro', type: 'Fuerza', secondaryMuscles: ['Core'] })
    expect(resolve({ muscle: 'Hombro', type: 'Fuerza', secondaryMuscles: [] })).toEqual({ muscle: 'Hombro', type: 'Fuerza' })
  })
})

describe('normalizeLibraryExercise', () => {
  it('is idempotent, for old rows and for the whole initial library', () => {
    const once = normalizeLibraryExercise({ id: 'own', name: 'Propio', category: 'Hombro', equipment: [], defaultMeasure: 'reps' })
    expect(normalizeLibraryExercise({ ...once })).toEqual(once)
    for (const exercise of EXERCISE_LIBRARY) expect(normalizeLibraryExercise({ ...exercise })).toEqual(exercise)
  })
})
