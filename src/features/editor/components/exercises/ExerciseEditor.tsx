import { SegmentedControl } from '../../../../components/ui'
import { MEASURE_META, MEASURE_ORDER } from '../../../../config/exerciseFields'
import { useAppActions } from '../../../../store'
import type { ExerciseEntry } from '../../../../types'
import { useRowKeyboard } from '../../hooks/useRowKeyboard'
import { useEditorUi } from '../../state/editorUiStore'
import type { WeekContext } from '../../types'
import { measurePatch } from '../../utils'
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
  weeks: WeekContext
}

/** All fields of one row: name (autocomplete) → measure → series/value/load → chips → 'Más opciones'. */
export function ExerciseEditor({ entry, blockId, index, showSets, weeks }: ExerciseEditorProps) {
  const { updateExercise, deleteExercise } = useAppActions()
  const closeRow = useEditorUi((s) => s.closeRow)
  const keyboard = useRowKeyboard(entry.id, blockId, index, showSets)
  /** Leaving a row that never got a name discards it (the 'type, Enter, next' flow leaves one behind). */
  const exit = () => {
    if (!entry.name.trim()) deleteExercise(entry.id)
    closeRow()
  }

  return (
    <div className="flex flex-col gap-4">
      <ExerciseNameField entry={entry} onDone={() => keyboard.advance('name')} onExit={exit} />
      <SegmentedControl
        ariaLabel="Tipo de medida"
        size="sm"
        options={MEASURE_OPTIONS}
        value={entry.measure}
        onChange={(measure) => updateExercise(entry.id, measurePatch(entry, measure))}
        className="self-start"
      />
      <BasicFields entry={entry} showSets={showSets} onFieldKeyDown={keyboard.onFieldKeyDown} />
      <QuickChips entry={entry} />
      <MoreOptions entry={entry} weeks={weeks} />
    </div>
  )
}
