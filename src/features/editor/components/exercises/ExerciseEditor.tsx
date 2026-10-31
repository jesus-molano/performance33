import { SegmentedControl } from '@/components/ui'
import { MEASURE_META, MEASURE_ORDER } from '@/config/exerciseFields'
import type { ExerciseEntry } from '@/types'
import { useExerciseFields } from '@/features/editor/hooks/useExerciseFields'
import { useRowKeyboard } from '@/features/editor/hooks/useRowKeyboard'
import { BasicFields } from './BasicFields'
import { ExerciseNameField } from './ExerciseNameField'
import { MoreOptions } from './MoreOptions'
import { QuickChips } from './QuickChips'

const MEASURE_OPTIONS = MEASURE_ORDER.map((value) => ({ value, label: MEASURE_META[value].label }))

export interface ExerciseEditorProps {
  entry: ExerciseEntry
  blockId: string
  index: number
  showSets: boolean
}

/**
 * All fields of one row: name (autocomplete) → measure → series/value/load → chips → 'Más opciones'.
 * Closing the row (Escape anywhere, another row, 'Listo') discards it if it never got a name.
 */
export function ExerciseEditor({ entry, blockId, index, showSets }: ExerciseEditorProps) {
  const fields = useExerciseFields(entry)
  const keyboard = useRowKeyboard(entry.id, blockId, index, showSets)

  return (
    <div className="flex flex-col gap-4">
      <ExerciseNameField entry={entry} onDone={() => keyboard.advance('name')} onExit={keyboard.exit} />
      <SegmentedControl
        ariaLabel="Tipo de medida"
        size="sm"
        options={MEASURE_OPTIONS}
        value={entry.measure}
        onChange={fields.setMeasure}
        className="self-start"
      />
      <BasicFields entry={entry} fields={fields} showSets={showSets} onFieldKeyDown={keyboard.onFieldKeyDown} />
      <QuickChips entry={entry} fields={fields} />
      <MoreOptions entry={entry} fields={fields} />
    </div>
  )
}
