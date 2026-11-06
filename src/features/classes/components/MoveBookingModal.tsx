import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { CLASSES_COPY, MOVE_COPY } from '@/features/classes/config/copy'
import { useMoveBooking } from '@/features/classes/hooks/useMoveBooking'
import type { SlotSummary } from '@/features/classes/types'
import { staffSlotState, type RosterEntry } from '@/features/classes/utils/slotView'
import { formatGymDay } from '@/features/classes/utils/time'
import { SlotSummaryLine } from './SlotSummaryLine'

export interface MoveBookingModalProps {
  from: SlotSummary
  entry: RosterEntry
  now: number
  onClose: () => void
}

/** Pick the new class (any day); render only while open. */
export function MoveBookingModal({ from, entry, now, onClose }: MoveBookingModalProps) {
  const move = useMoveBooking(from, entry, now, onClose)
  const name = entry.client?.firstName ?? entry.name
  return (
    <Modal open onClose={onClose} title={MOVE_COPY.title(name)} description={MOVE_COPY.description} fill>
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <IconButton icon={ChevronLeft} label={CLASSES_COPY.prevDay} variant="ghost" onClick={() => move.shiftDay(-1)} />
          <p className="text-md font-semibold text-fg first-letter:uppercase">{formatGymDay(move.date)}</p>
          <IconButton icon={ChevronRight} label={CLASSES_COPY.nextDay} variant="ghost" onClick={() => move.shiftDay(1)} />
        </div>
        {move.day.status !== 'ready' && !move.day.data ? (
          <p className="py-6 text-center text-md text-fg-muted">{move.day.status === 'error' ? CLASSES_COPY.loadFailed : CLASSES_COPY.loading}</p>
        ) : move.targets.length === 0 ? (
          <p className="py-6 text-center text-md text-fg-muted">{MOVE_COPY.none}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {move.targets.map(({ slot, current, alreadyIn, available }) => (
              <li key={slot.id}>
                <button
                  type="button"
                  onClick={() => move.moveTo(slot)}
                  disabled={!available || move.busy}
                  className={cn(
                    'flex min-h-16 w-full items-center gap-3 rounded-xl border border-line px-3 py-2 text-left',
                    available ? 'hover:bg-canvas' : 'opacity-55',
                  )}
                >
                  <SlotSummaryLine slot={slot} state={staffSlotState(slot, now)} />
                  {(current || alreadyIn) && (
                    <span className="shrink-0 text-sm font-medium text-fg-muted">{current ? MOVE_COPY.current : MOVE_COPY.alreadyIn}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
