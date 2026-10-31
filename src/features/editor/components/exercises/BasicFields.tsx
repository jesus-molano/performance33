import type { KeyboardEvent } from 'react'
import { Input } from '@/components/ui'
import { LOAD_UNIT_META } from '@/config/exerciseFields'
import { cn } from '@/lib/cn'
import { parseOptionalInt } from '@/lib/numbers'
import { breakUndoGroup } from '@/store'
import type { ExerciseEntry } from '@/types'
import type { ExerciseFieldsApi } from '@/features/editor/hooks/useExerciseFields'
import { useFieldFocus } from '@/features/editor/hooks/useFieldFocus'
import type { RowField } from '@/features/editor/store/editorUiStore'
import { MeasureValueField } from './MeasureValueField'

export interface BasicFieldsProps {
  entry: ExerciseEntry
  fields: ExerciseFieldsApi
  showSets: boolean
  onFieldKeyDown: (field: RowField) => (event: KeyboardEvent<HTMLInputElement>) => void
}

/**
 * Series · reps/tiempo/distancia/calorías · carga. Enter jumps to the next one.
 * Phones: series + value share a row and the load gets its own, so no field is too narrow.
 */
export function BasicFields({ entry, fields, showSets, onFieldKeyDown }: BasicFieldsProps) {
  const setsRef = useFieldFocus<HTMLInputElement>(entry.id, 'sets')
  const valueRef = useFieldFocus<HTMLInputElement>(entry.id, 'value')
  const loadRef = useFieldFocus<HTMLInputElement>(entry.id, 'load')
  const unit = LOAD_UNIT_META[entry.loadUnit]

  return (
    <div
      className={cn(
        'grid items-start gap-2 sm:gap-3',
        showSets ? 'grid-cols-[4.5rem_minmax(0,1fr)] sm:grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-2',
      )}
    >
      {showSets && (
        <Input
          ref={setsRef}
          label="Series"
          inputMode="numeric"
          value={entry.sets ?? ''}
          placeholder="3"
          onChange={(e) => fields.setField('sets', parseOptionalInt(e.target.value) || null)}
          onKeyDown={onFieldKeyDown('sets')}
          onBlur={breakUndoGroup}
          className="text-center text-base font-semibold tabular"
        />
      )}
      <MeasureValueField entry={entry} fields={fields} inputRef={valueRef} onKeyDown={onFieldKeyDown('value')} />
      <Input
        ref={loadRef}
        label="Carga"
        value={entry.load}
        placeholder={unit.placeholder}
        suffix={entry.loadUnit === 'text' ? undefined : unit.label}
        onChange={(e) => fields.setField('load', e.target.value)}
        onKeyDown={onFieldKeyDown('load')}
        onBlur={breakUndoGroup}
        containerClassName={cn(showSets && 'col-span-2 sm:col-span-1')}
        className="text-base font-semibold tabular"
      />
    </div>
  )
}
