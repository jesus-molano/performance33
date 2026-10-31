import type { KeyboardEvent, RefObject } from 'react'
import { Input } from '../../../../components/ui'
import { parseNumber } from '../../../../lib/numbers'
import { breakUndoGroup, useAppActions } from '../../../../store'
import type { ExerciseEntry } from '../../../../types'
import { TimeField } from './TimeField'

export interface MeasureValueFieldProps {
  entry: ExerciseEntry
  inputRef: RefObject<HTMLInputElement | null>
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
}

const VALUE_CLASSES = 'text-base font-semibold tabular'

/** The main value for the row's measure. Reps accept free text: '8-10', 'máx', '21-15-9'. */
export function MeasureValueField({ entry, inputRef, onKeyDown }: MeasureValueFieldProps) {
  const { updateExercise } = useAppActions()
  const shared = { ref: inputRef, onKeyDown, onBlur: breakUndoGroup, className: VALUE_CLASSES }

  switch (entry.measure) {
    case 'reps':
      return (
        <Input
          {...shared}
          label="Reps"
          value={entry.reps}
          placeholder="8-10"
          onChange={(e) => updateExercise(entry.id, { reps: e.target.value })}
        />
      )
    case 'time':
      return <TimeField {...shared} seconds={entry.durationSec} onChange={(durationSec) => updateExercise(entry.id, { durationSec })} />
    case 'distance':
      return (
        <Input
          {...shared}
          label="Distancia"
          inputMode="decimal"
          suffix="m"
          value={entry.distanceM ?? ''}
          placeholder="400"
          onChange={(e) => updateExercise(entry.id, { distanceM: parseNumber(e.target.value) })}
        />
      )
    case 'calories':
      return (
        <Input
          {...shared}
          label="Calorías"
          inputMode="numeric"
          suffix="cal"
          value={entry.calories ?? ''}
          placeholder="12"
          onChange={(e) => updateExercise(entry.id, { calories: parseNumber(e.target.value) })}
        />
      )
  }
}
