import { EXERCISE_NAME_MAX_LENGTH } from '@/config/capacity'
import { getLengthHint } from '@/lib/capacity'
import { findExerciseById } from '@/lib/search'
import { breakUndoGroup, useExerciseLibrary } from '@/store'
import type { LibraryExercise } from '@/types'
import { useExerciseAutocomplete, type AutocompleteOptions, type ExerciseAutocomplete } from './useExerciseAutocomplete'

export interface ExerciseNameFieldApi {
  ac: ExerciseAutocomplete
  /** Library exercise this row came from, if any. */
  linked: LibraryExercise | null
  lengthHint: string | null
  onBlur: () => void
}

export function useExerciseNameField(options: AutocompleteOptions): ExerciseNameFieldApi {
  const ac = useExerciseAutocomplete(options)
  const library = useExerciseLibrary()
  return {
    ac,
    linked: findExerciseById(options.entry.libraryId, library) ?? null,
    lengthHint: getLengthHint(options.entry.name, EXERCISE_NAME_MAX_LENGTH),
    onBlur: () => {
      ac.close()
      breakUndoGroup()
    },
  }
}
