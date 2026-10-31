import { useMemo } from 'react'
import { fitProgression, getBaseValue } from '@/lib/progression'
import { useAppActions } from '@/store'
import type { ExerciseEntry, Progression, ProgressionTarget } from '@/types'
import { createProgression, fillLinear, setWeekValue } from '@/features/editor/utils'

export interface ProgressionEditor {
  /** Normalised to the program's weeks; null when the row has no progression. */
  progression: Progression | null
  /** Placeholder for empty weeks (the row's base value). */
  baseValue: string
  enable: () => void
  remove: () => void
  setTarget: (target: ProgressionTarget) => void
  setValue: (weekIndex: number, value: string) => void
  fill: (step: number) => void
}

/** Weekly progression S1..SN for one row (TV shows only the current week's value). */
export function useProgressionEditor(entry: ExerciseEntry, weeks: number): ProgressionEditor {
  const { updateExercise } = useAppActions()
  const progression = useMemo(
    () => (entry.progression ? fitProgression(entry.progression, weeks) : null),
    [entry.progression, weeks],
  )
  const target = progression?.target ?? 'load'
  const save = (next: Progression | null) => updateExercise(entry.id, { progression: next })

  return {
    progression,
    baseValue: getBaseValue(entry, target),
    enable: () => save(createProgression(entry, weeks)),
    remove: () => save(null),
    setTarget: (next) => save({ target: next, values: Array.from({ length: weeks }, () => '') }),
    setValue: (weekIndex, value) => progression && save(setWeekValue(progression, weeks, weekIndex, value)),
    fill: (step) => save(fillLinear(entry, target, step, weeks)),
  }
}
