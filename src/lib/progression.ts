// Weekly progression helpers (pure).

import type { ExerciseEntry, Progression, ProgressionTarget } from '@/types'
import { formatNumber, parseNumber } from './numbers'

type EntryLike = Omit<ExerciseEntry, 'internalNote'> & { internalNote?: string }

/** Default progression target for a row: load if it has a load, else by measure. */
export function defaultProgressionTarget(entry: Pick<ExerciseEntry, 'load' | 'measure'>): ProgressionTarget {
  if (entry.load.trim()) return 'load'
  switch (entry.measure) {
    case 'time':
      return 'time'
    case 'distance':
      return 'distance'
    case 'calories':
      return 'calories'
    default:
      return 'reps'
  }
}

/** Base (non-progressed) value of the target field, as text. */
export function getBaseValue(entry: EntryLike, target: ProgressionTarget): string {
  switch (target) {
    case 'load':
      return entry.load
    case 'reps':
      return entry.reps
    case 'sets':
      return entry.sets == null ? '' : String(entry.sets)
    case 'time':
      return entry.durationSec == null ? '' : String(entry.durationSec)
    case 'distance':
      return entry.distanceM == null ? '' : String(entry.distanceM)
    case 'calories':
      return entry.calories == null ? '' : String(entry.calories)
  }
}

/**
 * Linear progression helper ('aumentar +2,5 kg/semana'):
 * buildLinearProgression('20', 2.5, 4) → ['20', '22,5', '25', '27,5'].
 * Non-numeric base → array of base repeated.
 */
export function buildLinearProgression(base: string, step: number, weeks: number): string[] {
  const n = parseNumber(base)
  return Array.from({ length: Math.max(1, weeks) }, (_, i) => (n == null ? base : formatNumber(n + step * i)))
}

/** Normalise a progression to exactly `weeks` slots (pads with '' / truncates). */
export function fitProgression(p: Progression, weeks: number): Progression {
  const values = Array.from({ length: Math.max(1, weeks) }, (_, i) => p.values[i] ?? '')
  return { ...p, values }
}

/** Value for a 1-based week, or null if not set (fall back to base). */
export function getProgressionValue(entry: Pick<ExerciseEntry, 'progression'>, week: number | null): string | null {
  if (!entry.progression || week == null) return null
  const v = entry.progression.values[week - 1]
  return v != null && v.trim() !== '' ? v.trim() : null
}

/**
 * Returns a copy of the entry with the given week's progression value applied to its target field.
 * Use before formatting for the display/TV.
 */
export function resolveEntryForWeek<T extends EntryLike>(entry: T, week: number | null): T {
  const v = getProgressionValue(entry, week)
  if (v == null || !entry.progression) return entry
  const num = parseNumber(v)
  switch (entry.progression.target) {
    case 'load':
      return { ...entry, load: v }
    case 'reps':
      return { ...entry, reps: v }
    case 'sets':
      return num == null ? entry : { ...entry, sets: Math.round(num) }
    case 'time':
      return num == null ? entry : { ...entry, durationSec: num }
    case 'distance':
      return num == null ? entry : { ...entry, distanceM: num }
    case 'calories':
      return num == null ? entry : { ...entry, calories: num }
  }
}
