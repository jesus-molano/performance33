// Pure helpers shared by the library manager (Ajustes) and the routine editor.

import { EXERCISE_SEARCH_SUFFIX, GOOGLE_SEARCH_URL } from '@/config/app'
import type { AnyLibraryExercise, ExerciseCategory } from '@/types'
import { searchExercises } from './search'

export type ExerciseScope = 'custom' | 'all'
export type ExerciseCategoryFilter = ExerciseCategory | 'all'

export interface ExerciseFilters {
  query: string
  category: ExerciseCategoryFilter
  /** A material name, or ALL_EQUIPMENT. */
  equipment: string
  scope: ExerciseScope
}

export const ALL_EQUIPMENT = 'all'
export const EMPTY_EXERCISE_FILTERS: ExerciseFilters = { query: '', category: 'all', equipment: ALL_EQUIPMENT, scope: 'all' }

const compareNames = (a: string, b: string): number => a.localeCompare(b, 'es', { sensitivity: 'base' })

/** Scope, category and material first; then the editor's fuzzy search, or A–Z when just browsing. */
export function filterExercises(library: readonly AnyLibraryExercise[], filters: ExerciseFilters): AnyLibraryExercise[] {
  const pool = library.filter(
    (e) =>
      (filters.scope === 'all' || e.custom) &&
      (filters.category === 'all' || e.category === filters.category) &&
      (filters.equipment === ALL_EQUIPMENT || e.equipment.includes(filters.equipment)),
  )
  if (!filters.query.trim()) return pool.sort((a, b) => compareNames(a.name, b.name))
  return searchExercises(filters.query, pool, pool.length).map((r) => r.exercise)
}

/** Every material used in the library, once, A–Z. */
export function collectEquipment(library: readonly AnyLibraryExercise[]): string[] {
  return [...new Set(library.flatMap((e) => e.equipment))].sort(compareNames)
}

/** 'a, b ,, c' → ['a', 'b', 'c']. */
export function splitList(text: string): string[] {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

/** 'Piernas · Kettlebell, Banco'. */
export function formatExerciseMeta(exercise: Pick<AnyLibraryExercise, 'category' | 'equipment'>): string {
  return [exercise.category, exercise.equipment.join(', ')].filter(Boolean).join(' · ')
}

/** Google search for an exercise by name, or null while it has no name. */
export function exerciseSearchUrl(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return null
  return `${GOOGLE_SEARCH_URL}${encodeURIComponent(`${trimmed} ${EXERCISE_SEARCH_SUFFIX}`)}`
}
