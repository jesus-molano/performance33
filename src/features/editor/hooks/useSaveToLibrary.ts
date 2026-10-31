import { useMemo } from 'react'
import { useToast } from '../../../hooks'
import { exercisePatchFromLibrary } from '../../../lib/factories'
import { findExerciseByName, findSimilarExercises } from '../../../lib/search'
import { useAppActions, useExerciseLibrary } from '../../../store'
import type { AnyLibraryExercise, ExerciseCategory, ExerciseEntry } from '../../../types'
import { canSaveToLibrary } from '../utils'

export interface LibraryDraft {
  name: string
  category: ExerciseCategory
  equipment: string
}

export interface SaveToLibraryApi {
  /** Free-text row whose name is not already in the library. */
  canSave: boolean
  /** Library entries with a very similar name (offer them before creating a duplicate). */
  similar: AnyLibraryExercise[]
  save: (draft: LibraryDraft) => void
  pickExisting: (exercise: AnyLibraryExercise) => void
}

const splitEquipment = (text: string) =>
  text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

/** 'Guardar en biblioteca' for a custom (free-text) exercise row. */
export function useSaveToLibrary(entry: ExerciseEntry): SaveToLibraryApi {
  const actions = useAppActions()
  const library = useExerciseLibrary()
  const { toast } = useToast()
  const canSave = canSaveToLibrary(entry) && !findExerciseByName(entry.name, library)
  const similar = useMemo(() => (canSave ? findSimilarExercises(entry.name, library) : []), [canSave, entry.name, library])

  return {
    canSave,
    similar,
    save: (draft) => {
      const id = actions.addCustomExercise({
        name: draft.name.trim(),
        category: draft.category,
        equipment: splitEquipment(draft.equipment),
        defaultMeasure: entry.measure,
        perSide: entry.perSide,
      })
      if (!id) return
      actions.updateExercise(entry.id, { libraryId: id, name: draft.name.trim() })
      toast({ message: `«${draft.name.trim()}» guardado en la biblioteca`, tone: 'success' })
    },
    pickExisting: (exercise) => actions.updateExercise(entry.id, exercisePatchFromLibrary(exercise, entry)),
  }
}
