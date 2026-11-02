import { Input, SegmentedControl } from '@/components/ui'
import { LOAD_UNIT_META, LOAD_UNIT_ORDER } from '@/config/exerciseFields'
import { formatLoad } from '@/lib/format'
import { parseNumber } from '@/lib/numbers'
import { breakUndoGroup } from '@/store'
import type { ExerciseEntry } from '@/types'
import type { ExerciseFieldsApi } from '@/features/editor/hooks/useExerciseFields'

const UNIT_OPTIONS = LOAD_UNIT_ORDER.map((value) => ({ value, label: LOAD_UNIT_META[value].label }))

/** How the load is expressed (kg, % 1RM, RPE, RIR or free text) + optional client 1RM. */
export function LoadOptions({ entry, fields }: { entry: ExerciseEntry; fields: ExerciseFieldsApi }) {
  const meta = LOAD_UNIT_META[entry.loadUnit]
  const preview = formatLoad(entry)

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-fg">Tipo de carga</span>
      <SegmentedControl
        ariaLabel="Tipo de carga"
        size="sm"
        fullWidth
        options={UNIT_OPTIONS}
        value={entry.loadUnit}
        onChange={(loadUnit) => fields.setField('loadUnit', loadUnit)}
      />
      <p className="text-sm text-fg-muted">{meta.help}</p>
      {entry.loadUnit === 'pct1rm' && (
        <Input
          label="1RM del usuario (opcional)"
          hint={preview ? `En pantalla: ${preview}` : 'Así la pantalla muestra también los kilos'}
          inputMode="decimal"
          suffix="kg"
          value={entry.rmKg ?? ''}
          placeholder="80"
          onBlur={breakUndoGroup}
          onChange={(e) => fields.setField('rmKg', parseNumber(e.target.value))}
          className="tabular"
        />
      )}
    </div>
  )
}
