import type { KeyboardEvent, RefObject } from 'react'
import { Input } from '@/components/ui'
import { useValueDraft } from '@/hooks'
import { breakUndoGroup } from '@/store'
import type { ExerciseEntry } from '@/types'
import type { ExerciseFieldsApi } from '@/features/editor/hooks/useExerciseFields'
import { inputToOptionalNumber, optionalNumberToInput } from '@/features/editor/utils'
import { TimeField } from './TimeField'

export interface MeasureValueFieldProps {
  entry: ExerciseEntry
  fields: ExerciseFieldsApi
  inputRef: RefObject<HTMLInputElement | null>
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
}

const VALUE_CLASSES = 'text-base font-semibold tabular'

interface NumberMeasureProps extends Omit<MeasureValueFieldProps, 'entry' | 'fields'> {
  label: string
  suffix: string
  placeholder: string
  value: number | null
  onCommit: (value: number | null) => void
}

/** Decimal value typed freely ('1,5' keeps its comma while typing). */
function NumberMeasureField({ label, suffix, placeholder, value, onCommit, inputRef, onKeyDown }: NumberMeasureProps) {
  const draft = useValueDraft({ value, format: optionalNumberToInput, parse: inputToOptionalNumber, onCommit })
  return (
    <Input
      ref={inputRef}
      label={label}
      inputMode="decimal"
      suffix={suffix}
      value={draft.text}
      placeholder={placeholder}
      onChange={(e) => draft.onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={() => {
        draft.onBlur()
        breakUndoGroup()
      }}
      className={VALUE_CLASSES}
    />
  )
}

/** The main value for the row's measure. Reps accept free text: '8-10', 'máx', '21-15-9'. */
export function MeasureValueField({ entry, fields, inputRef, onKeyDown }: MeasureValueFieldProps) {
  const { setField } = fields
  const shared = { inputRef, onKeyDown }

  switch (entry.measure) {
    case 'reps':
      return (
        <Input
          ref={inputRef}
          onKeyDown={onKeyDown}
          onBlur={breakUndoGroup}
          className={VALUE_CLASSES}
          label="Reps"
          value={entry.reps}
          placeholder="8-10"
          onChange={(e) => setField('reps', e.target.value)}
        />
      )
    case 'time':
      return <TimeField {...shared} seconds={entry.durationSec} onChange={(durationSec) => setField('durationSec', durationSec)} />
    case 'distance':
      return (
        <NumberMeasureField
          {...shared}
          label="Distancia"
          suffix="m"
          placeholder="400"
          value={entry.distanceM}
          onCommit={(distanceM) => setField('distanceM', distanceM)}
        />
      )
    case 'calories':
      return (
        <NumberMeasureField
          {...shared}
          label="Calorías"
          suffix="cal"
          placeholder="12"
          value={entry.calories}
          onCommit={(calories) => setField('calories', calories)}
        />
      )
  }
}
