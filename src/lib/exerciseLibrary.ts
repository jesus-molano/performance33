// Pure helpers shared by the library manager (Ajustes) and the routine editor.

import { EXERCISE_SEARCH_SUFFIX, GOOGLE_SEARCH_URL } from '@/config/app'
import { MUSCLE_GROUPS, MUSCLE_SEARCH_TERMS } from '@/config/exerciseTags'
import type { ExerciseType, LibraryExercise, MuscleGroup } from '@/types'
import { normalizeText, searchExercises } from './search'

export type MuscleFilter = MuscleGroup | 'all'
export type ExerciseTypeFilter = ExerciseType | 'all'

export interface ExerciseFilters {
  query: string
  muscle: MuscleFilter
  type: ExerciseTypeFilter
  /** A material name, or ALL_EQUIPMENT. */
  equipment: string
}

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i
const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:'])

export const ALL_EQUIPMENT = 'all'
export const EMPTY_EXERCISE_FILTERS: ExerciseFilters = { query: '', muscle: 'all', type: 'all', equipment: ALL_EQUIPMENT }

const compareNames = (a: string, b: string): number => a.localeCompare(b, 'es', { sensitivity: 'base' })

const worksMuscle = (exercise: LibraryExercise, muscle: MuscleFilter): boolean =>
  muscle === 'all' || exercise.muscle === muscle || (exercise.secondaryMuscles?.includes(muscle) ?? false)

/**
 * Muscle, type and material first; then the editor's fuzzy search, or A–Z when just browsing.
 * A muscle finds every exercise that works it: those where it is the main one come first.
 */
export function filterExercises(library: readonly LibraryExercise[], filters: ExerciseFilters): LibraryExercise[] {
  const pool = library.filter(
    (e) =>
      worksMuscle(e, filters.muscle) &&
      (filters.type === 'all' || e.type === filters.type) &&
      (filters.equipment === ALL_EQUIPMENT || e.equipment.includes(filters.equipment)),
  )
  if (filters.query.trim()) return searchExercises(filters.query, pool, pool.length).map((r) => r.exercise)
  const secondaryLast = (e: LibraryExercise) => (filters.muscle !== 'all' && e.muscle !== filters.muscle ? 1 : 0)
  return pool.sort((a, b) => secondaryLast(a) - secondaryLast(b) || compareNames(a.name, b.name))
}

export const hasActiveFilters = (filters: ExerciseFilters): boolean =>
  (Object.keys(EMPTY_EXERCISE_FILTERS) as Array<keyof ExerciseFilters>).some((key) => filters[key] !== EMPTY_EXERCISE_FILTERS[key])

/** The muscle a name mentions ('Curl de bíceps' → Bíceps), if any: a first guess the coach can change. */
export function inferMuscleGroup(name: string, among: readonly MuscleGroup[] = MUSCLE_GROUPS): MuscleGroup | undefined {
  const text = ` ${normalizeText(name)} `
  return among.find((muscle) => MUSCLE_SEARCH_TERMS[muscle].some((term) => text.includes(` ${term} `)))
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

/** 'Cuádriceps · Fuerza · Kettlebell, Banco'. */
export function formatExerciseMeta(exercise: Pick<LibraryExercise, 'muscle' | 'type' | 'equipment'>): string {
  return [exercise.muscle, exercise.type, exercise.equipment.join(', ')].filter(Boolean).join(' · ')
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
