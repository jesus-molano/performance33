// Accent-insensitive fuzzy search over the exercise library, with Spanish/English synonyms.

import { SEARCH_SYNONYM_GROUPS } from '@/config/synonyms'
import type { LibraryExercise } from '@/types'

/** Lowercase, strip accents/diacritics, collapse whitespace and punctuation. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%/ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function expandQuery(q: string): string[] {
  const out = new Set<string>([q])
  for (const group of SEARCH_SYNONYM_GROUPS) {
    for (const term of group) {
      if (q.includes(term)) {
        for (const alt of group) if (alt !== term) out.add(q.replace(term, alt))
      }
    }
  }
  return [...out]
}

/** Subsequence match score (0 = no match). Rewards consecutive chars. */
function subsequenceScore(needle: string, hay: string): number {
  let hi = 0
  let score = 0
  let streak = 0
  for (const ch of needle) {
    const idx = hay.indexOf(ch, hi)
    if (idx === -1) return 0
    streak = idx === hi ? streak + 1 : 1
    score += streak
    hi = idx + 1
  }
  return score
}

function scoreText(q: string, text: string): number {
  if (!q) return 1
  const t = normalizeText(text)
  if (!t) return 0
  if (t === q) return 1000
  if (t.startsWith(q)) return 800 - Math.min(100, t.length - q.length)
  const words = t.split(' ')
  const qWords = q.split(' ')
  // every query word is a prefix of some word
  if (qWords.every((qw) => words.some((w) => w.startsWith(qw)))) return 600 - Math.min(100, t.length)
  if (t.includes(q)) return 500 - Math.min(100, t.length)
  const tc = t.replace(/ /g, '')
  const qc = q.replace(/ /g, '')
  if (tc.includes(qc)) return 450 - Math.min(100, t.length) // 'pesomuerto'
  if (qc.length >= 3) {
    const s = subsequenceScore(qc, tc)
    if (s >= qc.length * 1.5) return 100 + s
  }
  return 0
}

export interface ExerciseSearchResult {
  exercise: LibraryExercise
  score: number
  /** Alias that matched better than the name, if any (to show 'Back squat'). */
  matchedAlias?: string
}

/**
 * Fuzzy, accent-insensitive search. Empty query returns [] (UI decides what to show).
 * Results sorted by score; ties broken by shorter name.
 */
export function searchExercises(query: string, library: LibraryExercise[], limit = 8): ExerciseSearchResult[] {
  const q = normalizeText(query)
  if (!q) return []
  const variants = expandQuery(q)
  const results: ExerciseSearchResult[] = []
  for (const ex of library) {
    let best = 0
    let matchedAlias: string | undefined
    for (const v of variants) {
      const penalty = v === q ? 0 : 20
      const raw = scoreText(v, ex.name)
      const s = raw ? raw - penalty : 0
      if (s > best) {
        best = s
        matchedAlias = undefined
      }
      for (const alias of ex.aliases ?? []) {
        const rawA = scoreText(v, alias)
        const sa = rawA ? rawA - 30 - penalty : 0
        if (sa > best) {
          best = sa
          matchedAlias = alias
        }
      }
    }
    if (best > 0) results.push({ exercise: ex, score: best, matchedAlias })
  }
  results.sort((a, b) => b.score - a.score || a.exercise.name.length - b.exercise.name.length)
  return results.slice(0, limit)
}

/** Library entries whose normalized name/alias equals or closely matches `name` (for "¿ya existe?" before saving). */
export function findSimilarExercises(name: string, library: LibraryExercise[], limit = 3): LibraryExercise[] {
  return searchExercises(name, library, limit)
    .filter((r) => r.score >= 450)
    .map((r) => r.exercise)
}

/** Exact (normalized) name match, or undefined. */
export function findExerciseByName(name: string, library: LibraryExercise[]): LibraryExercise | undefined {
  const n = normalizeText(name)
  return library.find((e) => normalizeText(e.name) === n)
}

export function findExerciseById(id: string | null | undefined, library: LibraryExercise[]): LibraryExercise | undefined {
  if (!id) return undefined
  return library.find((e) => e.id === id)
}

/** Generic accent-insensitive "contains" filter (e.g. client search). */
export function matchesQuery(query: string, ...fields: Array<string | undefined | null>): boolean {
  const q = normalizeText(query)
  if (!q) return true
  const hay = normalizeText(fields.filter(Boolean).join(' '))
  return q.split(' ').every((w) => hay.includes(w))
}
