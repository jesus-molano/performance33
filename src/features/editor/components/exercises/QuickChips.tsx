import type { ReactNode } from 'react'
import { Chip } from '../../../../components/ui'
import { REP_CHIPS, REST_CHIPS, TIME_CHIPS } from '../../../../config/exerciseFields'
import { useAppActions } from '../../../../store'
import type { ExerciseEntry } from '../../../../types'

function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs font-semibold tracking-wide text-fg-subtle uppercase">{label}</span>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">{children}</div>
    </div>
  )
}

/** One-tap values (no keyboard needed on mobile): reps or time, and rest between sets. */
export function QuickChips({ entry }: { entry: ExerciseEntry }) {
  const { updateExercise } = useAppActions()
  const update = (patch: Partial<ExerciseEntry>) => updateExercise(entry.id, patch)
  return (
    <div className="flex flex-col gap-2">
      {entry.measure === 'reps' && (
        <ChipRow label="Reps">
          {REP_CHIPS.map((reps) => (
            <Chip key={reps} active={entry.reps === reps} onClick={() => update({ reps })}>
              {reps}
            </Chip>
          ))}
        </ChipRow>
      )}
      {entry.measure === 'time' && (
        <ChipRow label="Tiempo">
          {TIME_CHIPS.map((chip) => (
            <Chip key={chip.sec} active={entry.durationSec === chip.sec} onClick={() => update({ durationSec: chip.sec })}>
              {chip.label}
            </Chip>
          ))}
        </ChipRow>
      )}
      <ChipRow label="Descanso">
        {REST_CHIPS.map((chip) => {
          const active = entry.restSec === chip.sec
          return (
            <Chip key={chip.sec} active={active} onClick={() => update({ restSec: active ? null : chip.sec })}>
              {chip.label}
            </Chip>
          )
        })}
      </ChipRow>
    </div>
  )
}
