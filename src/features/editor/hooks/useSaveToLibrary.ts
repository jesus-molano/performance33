import { useMemo, useState } from 'react'
import { EXERCISE_CATEGORIES } from '@/config/exerciseCategories'
import { useToast } from '@/hooks'
import { splitList } from '@/lib/exerciseLibrary'
import { exercisePatchFromLibrary } from '@/lib/factories'
import { findExerciseByName, findSimilarExercises } from '@/lib/search'
import { useAppActions, useExerciseLibrary } from '@/store'
import type { AnyLibraryExercise, ExerciseCategory, ExerciseEntry } from '@/types'
import { canSaveToLibrary } from '@/features/editor/utils'

export interface LibraryDraft {
  name: string
  category: ExerciseCategory
  /** Comma separated: 'Kettlebell, Banco'. */
  equipment: string
}

export interface SaveToLibraryApi {
  /** Free-text row whose name is not already in the library. */
  canSave: boolean
  /** Library entries with a very similar name (offer them before creating a duplicate). */
  similar: AnyLibraryExercise[]
  draft: LibraryDraft
  /** Starts a new draft from the row's current name (call when opening the dialog). */
  begin: () => void
  setField: <K extends keyof LibraryDraft>(key: K, value: LibraryDraft[K]) => void
  valid: boolean
  /** Saves the draft to the library and links the row to it. Returns false when invalid. */
  submit: () => boolean
  pickExisting: (exercise: AnyLibraryExercise) => void
}

const newDraft = (name: string): LibraryDraft => ({ name: name.trim(), category: EXERCISE_CATEGORIES[0], equipment: '' })

/** 'Guardar en biblioteca' for a custom (free-text) exercise row. */
export function useSaveToLibrary(entry: ExerciseEntry): SaveToLibraryApi {
  const actions = useAppActions()
  const library = useExerciseLibrary()
  const { toast } = useToast()
  const [draft, setDraft] = useState<LibraryDraft>(() => newDraft(entry.name))
  const canSave = canSaveToLibrary(entry) && !findExerciseByName(entry.name, library)
  const similar = useMemo(() => (canSave ? findSimilarExercises(entry.name, library) : []), [canSave, entry.name, library])
  const valid = draft.name.trim().length > 1

  return {
    canSave,
    similar,
    draft,
    begin: () => setDraft(newDraft(entry.name)),
    setField: (key, value) => setDraft((d) => ({ ...d, [key]: value })),
    valid,
    submit: () => {
      if (!valid) return false
      const name = draft.name.trim()
      const id = actions.addCustomExercise({
        name,
        category: draft.category,
        equipment: splitList(draft.equipment),
        defaultMeasure: entry.measure,
        perSide: entry.perSide,
      })
      if (!id) return false
      actions.updateExercise(entry.id, { libraryId: id, name })
      toast({ message: `«${name}» guardado en la biblioteca`, tone: 'success' })
      return true
    },
    pickExisting: (exercise) => actions.updateExercise(entry.id, exercisePatchFromLibrary(exercise, entry)),
  }
}
