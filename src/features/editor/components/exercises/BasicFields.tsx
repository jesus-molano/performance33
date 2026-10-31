import type { KeyboardEvent } from 'react'
import { Input } from '../../../../components/ui'
import { LOAD_UNIT_META } from '../../../../config/exerciseFields'
import { cn } from '../../../../lib/cn'
import { parseOptionalInt } from '../../../../lib/numbers'
import { breakUndoGroup, useAppActions } from '../../../../store'
import type { ExerciseEntry } from '../../../../types'
import { useFieldFocus } from '../../hooks/useFieldFocus'
import type { RowField } from '../../state/editorUiStore'
import { MeasureValueField } from './MeasureValueField'

export interface BasicFieldsProps {
  entry: ExerciseEntry
  showSets: boolean
  onFieldKeyDown: (field: RowField) => (event: KeyboardEvent<HTMLInputElement>) => void
}

/** Series · reps/tiempo/distancia/calorías · carga. Enter jumps to the next one. */
export function BasicFields({ entry, showSets, onFieldKeyDown }: BasicFieldsProps) {
  const { updateExercise } = useAppActions()
  const setsRef = useFieldFocus<HTMLInputElement>(entry.id, 'sets')
  const valueRef = useFieldFocus<HTMLInputElement>(entry.id, 'value')
  const loadRef = useFieldFocus<HTMLInputElement>(entry.id, 'load')
  const unit = LOAD_UNIT_META[entry.loadUnit]

  return (
    <div className={cn('grid items-start gap-2 sm:gap-3', showSets ? 'grid-cols-3' : 'grid-cols-2')}>
      {showSets && (
        <Input
          ref={setsRef}
          label="Series"
          inputMode="numeric"
          value={entry.sets ?? ''}
          placeholder="3"
          onChange={(e) => updateExercise(entry.id, { sets: parseOptionalInt(e.target.value) || null })}
          onKeyDown={onFieldKeyDown('sets')}
          onBlur={breakUndoGroup}
          className="text-center text-base font-semibold tabular"
        />
      )}
      <MeasureValueField entry={entry} inputRef={valueRef} onKeyDown={onFieldKeyDown('value')} />
      <Input
        ref={loadRef}
        label="Carga"
        value={entry.load}
        placeholder={unit.placeholder}
        suffix={entry.loadUnit === 'text' ? undefined : unit.label}
        onChange={(e) => updateExercise(entry.id, { load: e.target.value })}
        onKeyDown={onFieldKeyDown('load')}
        onBlur={breakUndoGroup}
        className="text-base font-semibold tabular"
      />
    </div>
  )
}
