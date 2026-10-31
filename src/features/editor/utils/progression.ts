// Pure helpers for the weekly progression strip (S1..SN).

import { LOAD_UNIT_META, PROGRESSION_TARGET_META } from '@/config/exerciseFields'
import { buildLinearProgression, defaultProgressionTarget, fitProgression, getBaseValue } from '@/lib/progression'
import type { ExerciseEntry, Progression, ProgressionTarget } from '@/types'

export const PROGRESSION_TARGETS = Object.keys(PROGRESSION_TARGET_META) as ProgressionTarget[]

export function createProgression(entry: ExerciseEntry, weeks: number): Progression {
  return fitProgression({ target: defaultProgressionTarget(entry), values: [] }, weeks)
}

export function setWeekValue(progression: Progression, weeks: number, index: number, value: string): Progression {
  const fitted = fitProgression(progression, weeks)
  return { ...fitted, values: fitted.values.map((v, i) => (i === index ? value : v)) }
}

/** 'Aumentar +step por semana' starting from the row's base value. */
export function fillLinear(entry: ExerciseEntry, target: ProgressionTarget, step: number, weeks: number): Progression {
  return { target, values: buildLinearProgression(getBaseValue(entry, target), step, weeks) }
}

/** Header for the strip: 'Carga (kg)', 'Reps'. */
export function progressionLabel(target: ProgressionTarget, entry: Pick<ExerciseEntry, 'loadUnit'>): string {
  const label = PROGRESSION_TARGET_META[target].label
  return target === 'load' ? `${label} (${LOAD_UNIT_META[entry.loadUnit].label})` : label
}
