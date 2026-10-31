import type { AnyLibraryExercise, CustomExerciseInput, ExerciseCategory, MeasureType } from '../../../types'

export interface ExerciseFormValues {
  name: string
  category: ExerciseCategory
  /** Comma separated: 'Kettlebell, Banco'. */
  equipment: string
  defaultMeasure: MeasureType
  perSide: boolean
  /** Comma separated other names: 'Goblet squat, Sentadilla copa'. */
  aliases: string
}

const DEFAULT_CATEGORY: ExerciseCategory = 'Piernas'

export function toExerciseFormValues(exercise: AnyLibraryExercise | null): ExerciseFormValues {
  return {
    name: exercise?.name ?? '',
    category: exercise?.category ?? DEFAULT_CATEGORY,
    equipment: exercise?.equipment.join(', ') ?? '',
    defaultMeasure: exercise?.defaultMeasure ?? 'reps',
    perSide: exercise?.perSide ?? false,
    aliases: exercise?.aliases?.join(', ') ?? '',
  }
}

/** 'a, b ,, c' → ['a', 'b', 'c']. */
export function splitList(text: string): string[] {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export function toCustomExerciseInput(values: ExerciseFormValues): CustomExerciseInput {
  return {
    name: values.name.trim(),
    category: values.category,
    equipment: splitList(values.equipment),
    defaultMeasure: values.defaultMeasure,
    perSide: values.perSide,
    aliases: splitList(values.aliases),
  }
}

/** 'Piernas · Kettlebell, Banco'. */
export function formatExerciseMeta(exercise: AnyLibraryExercise): string {
  return [exercise.category, exercise.equipment.join(', ')].filter(Boolean).join(' · ')
}
