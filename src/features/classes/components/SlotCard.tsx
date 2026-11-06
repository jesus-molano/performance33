import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { SlotSummary } from '@/features/classes/types'
import { slotCardDomId, staffSlotState } from '@/features/classes/utils/slotView'
import { SlotSummaryLine } from './SlotSummaryLine'

export interface SlotCardProps {
  slot: SlotSummary
  now: number
  selected: boolean
  onSelect: () => void
  /** Phones: the people of the class open right under it. */
  children?: ReactNode
  /** Opens in place (phones) instead of in the side panel. */
  expands: boolean
}

/** One class of the day: tap it to see and change who comes. */
export function SlotCard({ slot, now, selected, onSelect, children, expands }: SlotCardProps) {
  const state = staffSlotState(slot, now)
  const Chevron = expands && selected ? ChevronDown : ChevronRight
  return (
    <Card
      id={slotCardDomId(slot.id)}
      padding="none"
      className={cn('scroll-mt-[calc(var(--spacing-header)+1rem)] overflow-hidden', selected && 'ring-2 ring-brand-strong', state === 'cancelled' && 'bg-canvas')}>
      <button
        type="button"
        onClick={onSelect}
        aria-expanded={expands ? selected : undefined}
        aria-pressed={expands ? undefined : selected}
        className="flex min-h-18 w-full items-center gap-3 px-4 py-3 text-left hover:bg-canvas/60"
      >
        <SlotSummaryLine slot={slot} state={state} />
        <Chevron size={20} aria-hidden className="shrink-0 text-fg-subtle" />
      </button>
      {children && <div className="border-t border-line px-4 py-4">{children}</div>}
    </Card>
  )
}
