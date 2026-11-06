import type { ExerciseEntry, PublicExerciseEntry } from '../types.ts'
import { formatNumber, isPlainNumber, parseNumber } from '../numbers.ts'
import { resolveEntryForWeek } from '../progression.ts'
import { formatCalories, formatDistance, formatRest, formatSeconds } from './units.ts'

type EntryLike = PublicExerciseEntry | ExerciseEntry

/** Load → '60 kg', '70%', '70% (56 kg)', 'RPE 8', 'RIR 2', 'KB 16'. '' if none. */
export function formatLoad(entry: Pick<EntryLike, 'load' | 'loadUnit' | 'rmKg'>): string {
  const raw = entry.load.trim()
  const n = parseNumber(raw)
  if (!raw || !isPlainNumber(raw) || n == null) return raw
  switch (entry.loadUnit) {
    case 'kg':
      return `${formatNumber(n)} kg`
    case 'pct1rm': {
      const pct = `${formatNumber(n)}%`
      if (!entry.rmKg) return pct
      const kg = Math.round(((entry.rmKg * n) / 100) * 2) / 2
      return `${pct} (${formatNumber(kg)} kg)`
    }
    case 'rpe':
      return `RPE ${formatNumber(n)}`
    case 'rir':
      return `RIR ${formatNumber(n)}`
    case 'text':
      return raw
  }
}

function withPerSide(text: string, perSide: boolean): string {
  if (!perSide || !text) return text
  return /lado/i.test(text) ? text : `${text} c/lado`
}

function formatMeasure(entry: EntryLike): string {
  switch (entry.measure) {
    case 'reps':
      return entry.reps.trim()
    case 'time':
      return formatSeconds(entry.durationSec)
    case 'distance':
      return formatDistance(entry.distanceM)
    case 'calories':
      return formatCalories(entry.calories)
  }
}

/**
 * Volume part: '4 × 8-10', '8-10', '3 × 30″', '400 m', '15 cal', '10 c/lado'.
 * showSets=false hides series (circuits/EMOM/AMRAP… where rounds are block-level).
 */
export function formatVolume(entry: EntryLike, showSets = true): string {
  const core = withPerSide(formatMeasure(entry), entry.perSide)
  if (showSets && entry.sets != null && entry.sets > 0) {
    return core ? `${entry.sets} × ${core}` : `${entry.sets} series`
  }
  return core
}

export interface FormatEntryOptions {
  /** Default true. */
  showSets?: boolean
  /** 1-based week whose progression value applies (null = base values). */
  week?: number | null
  /** Include tempo (default true). */
  showTempo?: boolean
  /** Include rest (default true). */
  showRest?: boolean
}

/** Parts of an exercise prescription, already resolved for the week. */
export interface EntryParts {
  volume: string
  load: string
  tempo: string
  rest: string
}

export function getEntryParts(entry: EntryLike, opts: FormatEntryOptions = {}): EntryParts {
  const resolved = resolveEntryForWeek(entry, opts.week ?? null)
  const tempo = resolved.tempo.trim()
  return {
    volume: formatVolume(resolved, opts.showSets ?? true),
    load: formatLoad(resolved),
    tempo: (opts.showTempo ?? true) && tempo ? `tempo ${tempo}` : '',
    rest: (opts.showRest ?? true) && resolved.restSec ? `desc. ${formatRest(resolved.restSec)}` : '',
  }
}

/** One-line summary, e.g. '4 × 8-10 · 60 kg · tempo 3-1-1-0 · desc. 90s'. */
export function formatEntrySummary(entry: EntryLike, opts: FormatEntryOptions = {}): string {
  const parts = getEntryParts(entry, opts)
  return [parts.volume, parts.load, parts.tempo, parts.rest].filter(Boolean).join(' · ')
}
