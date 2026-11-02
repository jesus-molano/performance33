import { useCallback } from 'react'
import { useExerciseBrowser, useToast, type ExerciseBrowserApi } from '@/hooks'
import { useAppActions, useExerciseLibrary } from '@/store'
import type { LibraryExercise } from '@/types'

export interface LibraryBrowserApi extends ExerciseBrowserApi {
  totalCount: number
  remove: (exercise: LibraryExercise) => void
}

/** Ajustes → Ejercicios: filtered, paginated library + delete (with undo). */
export function useLibraryBrowser(): LibraryBrowserApi {
  const library = useExerciseLibrary()
  const browser = useExerciseBrowser()
  const { deleteLibraryExercise } = useAppActions()
  const { toastUndo } = useToast()

  const remove = useCallback(
    (exercise: LibraryExercise) => {
      deleteLibraryExercise(exercise.id)
      toastUndo(`«${exercise.name}» eliminado de la biblioteca`)
    },
    [deleteLibraryExercise, toastUndo],
  )

  return { ...browser, totalCount: library.length, remove }
}
