import { normalizeExerciseLink, splitList } from '@/lib/exerciseLibrary'
import type { LibraryExercise, LibraryExerciseInput, ExerciseCategory, MeasureType } from '@/types'

export interface ExerciseFormValues {
  name: string
  category: ExerciseCategory
  /** Comma separated: 'Kettlebell, Banco'. */
  equipment: string
  defaultMeasure: MeasureType
  perSide: boolean
  /** Comma separated other names: 'Goblet squat, Sentadilla copa'. */
  aliases: string
  /** Video or explanation; empty = none. */
  link: string
}

const DEFAULT_CATEGORY: ExerciseCategory = 'Piernas'

export function toExerciseFormValues(exercise: LibraryExercise | null): ExerciseFormValues {
  return {
    name: exercise?.name ?? '',
    category: exercise?.category ?? DEFAULT_CATEGORY,
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
    category: values.category,
    equipment: splitList(values.equipment),
    defaultMeasure: values.defaultMeasure,
    perSide: values.perSide,
    aliases: splitList(values.aliases),
    link: normalizeExerciseLink(values.link) ?? '',
  }
}

/** Empty is fine; anything else has to be a real web address. */
export const isValidLinkText = (text: string): boolean => !text.trim() || normalizeExerciseLink(text) !== null
