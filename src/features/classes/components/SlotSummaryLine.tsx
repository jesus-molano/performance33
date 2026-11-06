import { Badge } from '@/components/ui'
import { cn } from '@/lib/cn'
import { CLASSES_COPY } from '@/features/classes/config/copy'
import type { SlotSummary } from '@/features/classes/types'
import { slotBadge, slotCounts, type StaffSlotState } from '@/features/classes/utils/slotView'
import { slotTimeRange } from '@/features/classes/utils/time'

export interface SlotSummaryLineProps {
  slot: SlotSummary
  state: StaffSlotState
  /** Bigger time, for the head of the people list. */
  large?: boolean
}

/** '18:00–19:00 · Entrenamiento', then '8/10 · +2 en espera' and the state badge. */
export function SlotSummaryLine({ slot, state, large = false }: SlotSummaryLineProps) {
  const counts = slotCounts(slot)
  const badge = slotBadge(state)
  const muted = state === 'cancelled' || state === 'finished'
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className={cn('min-w-0 truncate text-fg', large ? 'text-lg' : 'text-md', muted && 'text-fg-muted')}>
        <span className="font-semibold tabular">{slotTimeRange(slot)}</span>
        <span className="text-fg-muted"> · {slot.name}</span>
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted">
        <span className="font-semibold text-fg tabular" aria-label={CLASSES_COPY.spotsLabel(slot.bookedCount, slot.capacity, slot.waitlistCount)}>
          {counts.places}
        </span>
        {counts.waitlist && <span aria-hidden>· {counts.waitlist}</span>}
        <Badge tone={badge.tone} size="sm">
          {badge.label}
        </Badge>
      </div>
    </div>
  )
}
