import { Chip } from '@/components/ui'
import { CLIENT_SCREEN_COPY } from '@/features/clients/config'
import type { ScreenDayOption } from '@/features/screens'

export interface ScreenDayChipsProps {
  days: ScreenDayOption[]
  day: number
  onChoose: (day: number) => void
}

/** 'Día 1 · Día 2 · Día 3' at the top of the picker; hidden when the routine has a single day. */
export function ScreenDayChips({ days, day, onChoose }: ScreenDayChipsProps) {
  if (days.length < 2) return null
  return (
    <div role="group" aria-label={CLIENT_SCREEN_COPY.dayGroup} className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-fg-muted">{CLIENT_SCREEN_COPY.dayGroup}</span>
      {days.map((option) => (
        <Chip key={option.day} active={option.day === day} title={option.label} onClick={() => onChoose(option.day)}>
          {CLIENT_SCREEN_COPY.dayChip(option.day)}
        </Chip>
      ))}
    </div>
  )
}
