import { describe, expect, it } from 'vitest'
import { toExerciseFormValues, toggleMuscle, withMainMuscle } from './exerciseForm'

describe('withMainMuscle', () => {
  it('takes the new main muscle out of the secondary ones', () => {
    const values = { ...toExerciseFormValues(null), muscle: 'Pecho' as const, secondaryMuscles: ['Hombro' as const, 'Tríceps' as const] }
    expect(withMainMuscle(values, 'Hombro')).toMatchObject({ muscle: 'Hombro', secondaryMuscles: ['Tríceps'] })
  })
})

describe('toggleMuscle', () => {
  it('adds and removes', () => {
    expect(toggleMuscle(['Core'], 'Hombro')).toEqual(['Core', 'Hombro'])
    expect(toggleMuscle(['Core', 'Hombro'], 'Core')).toEqual(['Hombro'])
  })
})

describe('toExerciseFormValues', () => {
  it('a new exercise starts neutral', () => {
    expect(toExerciseFormValues(null)).toMatchObject({ muscle: 'Cuerpo entero', secondaryMuscles: [], type: 'Fuerza' })
  })
})
