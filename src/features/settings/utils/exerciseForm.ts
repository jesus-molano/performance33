import { DEFAULT_EXERCISE_TYPE, DEFAULT_MUSCLE } from '@/config/exerciseTags'
import { normalizeExerciseLink, splitList } from '@/lib/exerciseLibrary'
import type { ExerciseType, LibraryExercise, LibraryExerciseInput, MeasureType, MuscleGroup } from '@/types'

export interface ExerciseFormValues {
  name: string
  muscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  type: ExerciseType
  /** Comma separated: 'Kettlebell, Banco'. */
  equipment: string
  defaultMeasure: MeasureType
  perSide: boolean
  /** Comma separated other names: 'Goblet squat, Sentadilla copa'. */
  aliases: string
  /** Video or explanation; empty = none. */
  link: string
}

export function toExerciseFormValues(exercise: LibraryExercise | null): ExerciseFormValues {
  return {
    name: exercise?.name ?? '',
    muscle: exercise?.muscle ?? DEFAULT_MUSCLE,
    secondaryMuscles: exercise?.secondaryMuscles ?? [],
    type: exercise?.type ?? DEFAULT_EXERCISE_TYPE,
    equipment: exercise?.equipment.join(', ') ?? '',
    defaultMeasure: exercise?.defaultMeasure ?? 'reps',
    perSide: exercise?.perSide ?? false,
    aliases: exercise?.aliases?.join(', ') ?? '',
    link: exercise?.link ?? '',
  }
}

export function toLibraryExerciseInput(values: ExerciseFormValues): LibraryExerciseInput {
  return {
    name: values.name.trim(),
    muscle: values.muscle,
    secondaryMuscles: values.secondaryMuscles,
    type: values.type,
    equipment: splitList(values.equipment),
    defaultMeasure: values.defaultMeasure,
    perSide: values.perSide,
    aliases: splitList(values.aliases),
    link: normalizeExerciseLink(values.link) ?? '',
  }
}

/** A muscle is never both main and secondary. */
export function withMainMuscle(values: ExerciseFormValues, muscle: MuscleGroup): ExerciseFormValues {
  return { ...values, muscle, secondaryMuscles: values.secondaryMuscles.filter((m) => m !== muscle) }
}

export function toggleMuscle(list: readonly MuscleGroup[], muscle: MuscleGroup): MuscleGroup[] {
  return list.includes(muscle) ? list.filter((m) => m !== muscle) : [...list, muscle]
}

/** Empty is fine; anything else has to be a real web address. */
export const isValidLinkText = (text: string): boolean => !text.trim() || normalizeExerciseLink(text) !== null
