// Library rows saved before exercises had a muscle and a type carry a single `category`. They stay as they are in the
// database (a jsonb column) and are translated here every time they are read; the next edit saves the new shape.

import { DEFAULT_EXERCISE_TYPE, DEFAULT_MUSCLE, EXERCISE_TYPES, MUSCLE_GROUPS } from '@/config/exerciseTags'
import { inferMuscleGroup } from '@/lib/exerciseLibrary'
import type { ExerciseType, LibraryExercise, MuscleGroup } from '@/types'

export type ExerciseTags = Pick<LibraryExercise, 'muscle' | 'type' | 'secondaryMuscles'>

interface LegacyCategory {
  muscle: MuscleGroup
  type: ExerciseType
  /** The category covered several muscles: the name may say which one. */
  refineAmong?: readonly MuscleGroup[]
}

const LEGACY_CATEGORIES: Readonly<Record<string, LegacyCategory>> = {
  Piernas: { muscle: 'Cuádriceps', type: 'Fuerza', refineAmong: ['Femoral', 'Glúteo', 'Gemelo', 'Aductores', 'Abductores'] },
  Glúteo: { muscle: 'Glúteo', type: 'Fuerza' },
  Empuje: { muscle: 'Pecho', type: 'Fuerza', refineAmong: ['Hombro', 'Tríceps'] },
  Tracción: { muscle: 'Espalda', type: 'Fuerza', refineAmong: ['Bíceps'] },
  Hombro: { muscle: 'Hombro', type: 'Fuerza' },
  Brazos: { muscle: 'Bíceps', type: 'Fuerza', refineAmong: ['Tríceps', 'Antebrazo'] },
  Core: { muscle: 'Core', type: 'Fuerza' },
  Halterofilia: { muscle: 'Cuerpo entero', type: 'Halterofilia' },
  Gimnásticos: { muscle: 'Cuerpo entero', type: 'Gimnásticos' },
  Cardio: { muscle: 'Cuerpo entero', type: 'Cardio' },
  Pliometría: { muscle: 'Cuerpo entero', type: 'Pliometría' },
  Movilidad: { muscle: 'Cuerpo entero', type: 'Movilidad' },
}

const isMuscle = (value: unknown): value is MuscleGroup => MUSCLE_GROUPS.includes(value as MuscleGroup)
const isExerciseType = (value: unknown): value is ExerciseType => EXERCISE_TYPES.includes(value as ExerciseType)

function tags(muscle: MuscleGroup, type: ExerciseType, secondary: unknown): ExerciseTags {
  const list = Array.isArray(secondary) ? secondary.filter(isMuscle).filter((m) => m !== muscle && m !== 'Cuerpo entero') : []
  return { muscle, type, ...(list.length ? { secondaryMuscles: [...new Set(list)] } : {}) }
}

function fromLegacyCategory(category: unknown, name: string): ExerciseTags {
  const legacy = typeof category === 'string' ? LEGACY_CATEGORIES[category] : undefined
  if (!legacy) return tags(inferMuscleGroup(name) ?? DEFAULT_MUSCLE, DEFAULT_EXERCISE_TYPE, [])
  const refined = legacy.refineAmong && inferMuscleGroup(name, legacy.refineAmong)
  return tags(refined || legacy.muscle, legacy.type, [])
}

/**
 * Tags of a stored row. Valid ones are kept as they are, so a coach's edit always wins. Without them: an exercise from
 * the initial library takes its tags from there, any other is translated from its old category.
 */
export function resolveExerciseTags(raw: Record<string, unknown>, id: string, name: string, initialLibrary: ReadonlyMap<string, LibraryExercise>): ExerciseTags {
  const initial = initialLibrary.get(id)
  if (isMuscle(raw.muscle)) return tags(raw.muscle, isExerciseType(raw.type) ? raw.type : (initial?.type ?? DEFAULT_EXERCISE_TYPE), raw.secondaryMuscles)
  if (initial) return tags(initial.muscle, initial.type, initial.secondaryMuscles)
  return fromLegacyCategory(raw.category, name)
}
