// Pure helpers for exercise rows in the editor.

import type { ExerciseEntry, ExercisePatch, MeasureType } from '@/types'
import { MEASURE_DEFAULTS } from '@/features/editor/config'
import type { RowField } from '@/features/editor/store/editorUiStore'

/** Patch for switching the measure type, filling a sensible value when the new field is empty. */
export function measurePatch(entry: ExerciseEntry, measure: MeasureType): ExercisePatch {
  if (measure === 'time' && entry.durationSec == null) return { measure, durationSec: MEASURE_DEFAULTS.time }
  if (measure === 'distance' && entry.distanceM == null) return { measure, distanceM: MEASURE_DEFAULTS.distance }
  if (measure === 'calories' && entry.calories == null) return { measure, calories: MEASURE_DEFAULTS.calories }
  return { measure }
}

/** Enter moves through these fields; Enter on the last one adds the next row. */
export function rowFieldOrder(showSets: boolean): RowField[] {
  return showSets ? ['name', 'sets', 'value', 'load'] : ['name', 'value', 'load']
}

/** Next field after `current`, or null when `current` is the last one. */
export function nextRowField(order: RowField[], current: RowField): RowField | null {
  const index = order.indexOf(current)
  return index === -1 || index === order.length - 1 ? null : order[index + 1]
}

/** How many optional fields ('Más opciones') hold a value. */
export function countOptionalValues(entry: ExerciseEntry): number {
  return [
    entry.loadUnit !== 'kg',
    entry.tempo.trim() !== '',
    entry.perSide,
    entry.cue.trim() !== '',
    entry.internalNote.trim() !== '',
    entry.progression !== null,
  ].filter(Boolean).length
}

/** Free-text row (not linked to the library) that could be saved to it. */
export function canSaveToLibrary(entry: Pick<ExerciseEntry, 'libraryId' | 'name'>): boolean {
  return entry.libraryId === null && entry.name.trim().length > 1
}

/** Typing in the name field unlinks the library exercise unless the text still matches it. */
export function namePatch(entry: Pick<ExerciseEntry, 'name' | 'libraryId'>, name: string): ExercisePatch {
  return entry.libraryId && name !== entry.name ? { name, libraryId: null } : { name }
}
