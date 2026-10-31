import { searchExercises } from '../../../lib/search'
import type { AnyLibraryExercise, ExerciseCategory } from '../../../types'

export type LibraryScope = 'custom' | 'all'
export type CategoryFilter = ExerciseCategory | 'all'

export interface LibraryFilters {
  query: string
  category: CategoryFilter
  scope: LibraryScope
}

/** Scope + category first, then the same fuzzy search the editor uses (accents, synonyms, typos). */
export function filterLibrary(library: readonly AnyLibraryExercise[], filters: LibraryFilters): AnyLibraryExercise[] {
  const pool = library.filter(
    (e) => (filters.scope === 'all' || e.custom) && (filters.category === 'all' || e.category === filters.category),
  )
  if (!filters.query.trim()) return pool
  return searchExercises(filters.query, pool, pool.length).map((r) => r.exercise)
}
