import { useCallback, useMemo, useState } from 'react'
import { EXERCISE_PAGE_SIZE } from '@/config/app'
import { collectEquipment, EMPTY_EXERCISE_FILTERS, filterExercises, hasActiveFilters, type ExerciseFilters } from '@/lib/exerciseLibrary'
import { useExerciseLibrary } from '@/store'
import type { LibraryExercise } from '@/types'
import { usePagination, type PaginationApi } from './usePagination'

export interface ExerciseBrowserApi {
  filters: ExerciseFilters
  /** Changing a filter goes back to the first page. */
  setFilter: <K extends keyof ExerciseFilters>(key: K, value: ExerciseFilters[K]) => void
  /** Any filter or search in use. */
  filtered: boolean
  clearFilters: () => void
  equipment: string[]
  pagination: PaginationApi<LibraryExercise>
}

/** Filters + pagination over the whole library (Ajustes → Ejercicios and the editor's 'Ver todos'). */
export function useExerciseBrowser(): ExerciseBrowserApi {
  const library = useExerciseLibrary()
  const [filters, setFilters] = useState<ExerciseFilters>(EMPTY_EXERCISE_FILTERS)
  const matches = useMemo(() => filterExercises(library, filters), [library, filters])
  const equipment = useMemo(() => collectEquipment(library), [library])
  const pagination = usePagination(matches, EXERCISE_PAGE_SIZE)
  const { setPage } = pagination

  const setFilter: ExerciseBrowserApi['setFilter'] = useCallback(
    (key, value) => {
      setFilters((current) => ({ ...current, [key]: value }))
      setPage(1)
    },
    [setPage],
  )

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_EXERCISE_FILTERS)
    setPage(1)
  }, [setPage])

  return { filters, setFilter, filtered: hasActiveFilters(filters), clearFilters, equipment, pagination }
}
