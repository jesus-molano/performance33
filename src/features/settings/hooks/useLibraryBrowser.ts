import { useCallback, useMemo } from 'react'
import { useExerciseBrowser, useToast, type ExerciseBrowserApi } from '@/hooks'
import { useAppActions, useExerciseLibrary } from '@/store'
import type { AnyLibraryExercise } from '@/types'

export interface LibraryBrowserApi extends ExerciseBrowserApi {
  customCount: number
  totalCount: number
  remove: (exercise: AnyLibraryExercise) => void
}

/** Ajustes → Ejercicios: filtered, paginated library + delete of custom exercises (with undo). */
export function useLibraryBrowser(): LibraryBrowserApi {
  const library = useExerciseLibrary()
  const browser = useExerciseBrowser()
  const { deleteCustomExercise } = useAppActions()
  const { toastUndo } = useToast()
  const customCount = useMemo(() => library.filter((e) => e.custom).length, [library])

  const remove = useCallback(
    (exercise: AnyLibraryExercise) => {
      deleteCustomExercise(exercise.id)
      toastUndo(`«${exercise.name}» eliminado de la biblioteca`)
    },
    [deleteCustomExercise, toastUndo],
  )

  return { ...browser, customCount, totalCount: library.length, remove }
}
