import { cn } from '@/lib/cn'
import type { Day } from '@/types'
import { pointerListenersOnly, useSortableItem } from '@/features/editor/hooks/useSortableItem'

export interface DayNumberTabProps {
  day: Day
  number: number
  selected: boolean
  onSelect: () => void
}

/** One numbered day on phones. The name goes right below the row; keyboard users move days from the '⋯' menu. */
export function DayNumberTab({ day, number, selected, onSelect }: DayNumberTabProps) {
  const { setNodeRef, style, isDragging, handle } = useSortableItem(day.id)
  return (
    <button
      ref={(element) => {
        setNodeRef(element)
        handle.setActivator(element)
      }}
      style={style}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-label={day.name || `Día ${number}`}
      title="Mantén pulsado y arrastra para cambiarlo de orden"
      onClick={onSelect}
      onContextMenu={(event) => event.preventDefault()}
      {...pointerListenersOnly(handle.listeners)}
      className={cn(
        'h-11 min-w-0 touch-manipulation rounded-xl text-base font-semibold tabular transition-colors select-none [-webkit-touch-callout:none]',
        selected ? 'bg-ink text-white shadow-card' : 'text-fg-muted active:bg-fg/5',
        isDragging && 'opacity-80 shadow-pop',
      )}
    >
      {number}
    </button>
  )
}
