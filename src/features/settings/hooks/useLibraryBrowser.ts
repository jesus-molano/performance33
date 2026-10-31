import { useCallback, useMemo, useState } from 'react'
import { useToast } from '@/hooks'
import { useAppActions, useExerciseLibrary } from '@/store'
import type { AnyLibraryExercise } from '@/types'
import { LIBRARY_VISIBLE_LIMIT } from '@/features/settings/config'
import { filterLibrary, type LibraryFilters } from '@/features/settings/utils/libraryFilter'

export interface LibraryBrowserApi {
  filters: LibraryFilters
  setFilter: <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => void
  visible: AnyLibraryExercise[]
  matchCount: number
  customCount: number
  totalCount: number
  remove: (exercise: AnyLibraryExercise) => void
}

/** Ajustes → Ejercicios: filtered library list + delete of custom exercises (with undo). */
export function useLibraryBrowser(): LibraryBrowserApi {
  const library = useExerciseLibrary()
  const { deleteCustomExercise } = useAppActions()
  const { toastUndo } = useToast()
  const customCount = useMemo(() => library.filter((e) => e.custom).length, [library])
  const [filters, setFilters] = useState<LibraryFilters>(() => ({ query: '', category: 'all', scope: customCount > 0 ? 'custom' : 'all' }))

  const setFilter: LibraryBrowserApi['setFilter'] = useCallback((key, value) => setFilters((f) => ({ ...f, [key]: value })), [])
  const matches = useMemo(() => filterLibrary(library, filters), [library, filters])

  const remove = useCallback(
    (exercise: AnyLibraryExercise) => {
      deleteCustomExercise(exercise.id)
      toastUndo(`«${exercise.name}» eliminado de la biblioteca`)
    },
    [deleteCustomExercise, toastUndo],
  )

  return {
    filters,
    setFilter,
    visible: matches.slice(0, LIBRARY_VISIBLE_LIMIT),
    matchCount: matches.length,
    customCount,
    totalCount: library.length,
    remove,
  }
}
