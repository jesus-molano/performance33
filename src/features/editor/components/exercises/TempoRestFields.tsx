import { HelpTip, Input } from '../../../../components/ui'
import { TEMPO_HELP } from '../../../../config/exerciseFields'
import { parseOptionalInt } from '../../../../lib/numbers'
import { breakUndoGroup, useAppActions } from '../../../../store'
import type { ExerciseEntry } from '../../../../types'

/** Tempo (E-P-C-P) and exact rest between sets in seconds. */
export function TempoRestFields({ entry }: { entry: ExerciseEntry }) {
  const { updateExercise } = useAppActions()
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input
        label={
          <span className="inline-flex items-center gap-1.5">
            Tempo
            <HelpTip text={TEMPO_HELP} />
          </span>
        }
        value={entry.tempo}
        placeholder="3-1-1-0"
        onBlur={breakUndoGroup}
        onChange={(e) => updateExercise(entry.id, { tempo: e.target.value.toUpperCase() })}
        className="tabular"
      />
      <Input
        label="Descanso entre series"
        inputMode="numeric"
        suffix="s"
        value={entry.restSec ?? ''}
        placeholder="90"
        onBlur={breakUndoGroup}
        onChange={(e) => updateExercise(entry.id, { restSec: parseOptionalInt(e.target.value) || null })}
        className="tabular"
      />
    </div>
  )
}
