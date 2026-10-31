import { useCallback, useMemo } from 'react'
import { useAppActions } from '@/store'
import type { ExerciseEntry, ExercisePatch, MeasureType } from '@/types'
import { measurePatch } from '@/features/editor/utils'

export interface ExerciseFieldsApi {
  setField: <K extends keyof ExercisePatch>(key: K, value: ExercisePatch[K]) => void
  /** Several fields in one undo step (e.g. picking a library exercise). */
  update: (patch: ExercisePatch) => void
  /** Switches the measure, filling a sensible value when the new field is empty. */
  setMeasure: (measure: MeasureType) => void
}

/** Field edits of one exercise row, bound to its id. */
export function useExerciseFields(entry: ExerciseEntry): ExerciseFieldsApi {
  const { updateExercise } = useAppActions()
  const update = useCallback((patch: ExercisePatch) => updateExercise(entry.id, patch), [updateExercise, entry.id])
  const setMeasure = useCallback((measure: MeasureType) => update(measurePatch(entry, measure)), [update, entry])
  return useMemo(
    () => ({ update, setMeasure, setField: (key, value) => update({ [key]: value }) }),
    [update, setMeasure],
  )
}
