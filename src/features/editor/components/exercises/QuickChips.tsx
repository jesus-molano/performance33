import type { ReactNode } from 'react'
import { Chip } from '@/components/ui'
import { PER_SIDE_CHIP_LABEL, REP_CHIPS, REST_CHIPS, TIME_CHIPS } from '@/config/exerciseFields'
import type { ExerciseEntry } from '@/types'
import type { ExerciseFieldsApi } from '@/features/editor/hooks/useExerciseFields'

function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs font-semibold tracking-wide text-fg-muted uppercase">{label}</span>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">{children}</div>
    </div>
  )
}

export interface QuickChipsProps {
  entry: ExerciseEntry
  fields: ExerciseFieldsApi
}

/** One-tap values (no keyboard needed on mobile). Every chip toggles: tap again to clear it. */
export function QuickChips({ entry, fields }: QuickChipsProps) {
  const { setField } = fields
  return (
    <div className="flex flex-col gap-2">
      {entry.measure === 'reps' && (
        <ChipRow label="Reps">
          {REP_CHIPS.map((reps) => {
            const active = entry.reps === reps
            return (
              <Chip key={reps} active={active} onClick={() => setField('reps', active ? '' : reps)}>
                {reps}
              </Chip>
            )
          })}
          <Chip active={entry.perSide} onClick={() => setField('perSide', !entry.perSide)}>
            {PER_SIDE_CHIP_LABEL}
          </Chip>
        </ChipRow>
      )}
      {entry.measure === 'time' && (
        <ChipRow label="Tiempo">
          {TIME_CHIPS.map((chip) => {
            const active = entry.durationSec === chip.sec
            return (
              <Chip key={chip.sec} active={active} onClick={() => setField('durationSec', active ? null : chip.sec)}>
                {chip.label}
              </Chip>
            )
          })}
        </ChipRow>
      )}
      <ChipRow label="Descanso">
        {REST_CHIPS.map((chip) => {
          const active = entry.restSec === chip.sec
          return (
            <Chip key={chip.sec} active={active} onClick={() => setField('restSec', active ? null : chip.sec)}>
              {chip.label}
            </Chip>
          )
        })}
      </ChipRow>
    </div>
  )
}
