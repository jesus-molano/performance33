// Pure helpers shared by the library manager (Ajustes) and the routine editor.

import { EXERCISE_SEARCH_SUFFIX, GOOGLE_SEARCH_URL } from '@/config/app'
import type { LibraryExercise, ExerciseCategory } from '@/types'
import { searchExercises } from './search'

export type ExerciseCategoryFilter = ExerciseCategory | 'all'

export interface ExerciseFilters {
  query: string
  category: ExerciseCategoryFilter
  /** A material name, or ALL_EQUIPMENT. */
  equipment: string
}

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i
const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:'])

export const ALL_EQUIPMENT = 'all'
export const EMPTY_EXERCISE_FILTERS: ExerciseFilters = { query: '', category: 'all', equipment: ALL_EQUIPMENT }

const compareNames = (a: string, b: string): number => a.localeCompare(b, 'es', { sensitivity: 'base' })

/** Category and material first; then the editor's fuzzy search, or A–Z when just browsing. */
export function filterExercises(library: readonly LibraryExercise[], filters: ExerciseFilters): LibraryExercise[] {
  const pool = library.filter(
    (e) =>
      (filters.category === 'all' || e.category === filters.category) &&
      (filters.equipment === ALL_EQUIPMENT || e.equipment.includes(filters.equipment)),
  )
  if (!filters.query.trim()) return pool.sort((a, b) => compareNames(a.name, b.name))
  return searchExercises(filters.query, pool, pool.length).map((r) => r.exercise)
}

/** Every material used in the library, once, A–Z. */
export function collectEquipment(library: readonly LibraryExercise[]): string[] {
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
export function formatExerciseMeta(exercise: Pick<LibraryExercise, 'category' | 'equipment'>): string {
  return [exercise.category, exercise.equipment.join(', ')].filter(Boolean).join(' · ')
}

/** What a coach typed as a link: a clean http/https address (the https:// may be left out), or null when it is not valid. */
export function normalizeExerciseLink(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed || /\s/.test(trimmed)) return null
  try {
    const url = new URL(HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`)
    return ALLOWED_LINK_PROTOCOLS.has(url.protocol) && url.hostname.includes('.') ? url.href : null
  } catch {
    return null
  }
}

/** Google search for an exercise by name, or null while it has no name. */
export function exerciseSearchUrl(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return null
  return `${GOOGLE_SEARCH_URL}${encodeURIComponent(`${trimmed} ${EXERCISE_SEARCH_SUFFIX}`)}`
}

/** Where the row's link icon goes: the exercise's own link (checked again, data can be edited elsewhere), else a search by name. */
export function exerciseLinkUrl(name: string, link?: string | null): string | null {
  return (link ? normalizeExerciseLink(link) : null) ?? exerciseSearchUrl(name)
}
