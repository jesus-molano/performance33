import { cn } from '../../../../lib/cn'
import type { Day } from '../../../../types'
import { pointerListenersOnly, useSortableItem } from '../../hooks/useSortableItem'

export interface DayTabProps {
  day: Day
  selected: boolean
  onSelect: () => void
}

/**
 * One day pill. Mouse/touch can drag it directly (activation distance/delay keeps clicks working);
 * keyboard users reorder with the day '⋯' menu, so Enter/Space keep selecting the tab.
 */
export function DayTab({ day, selected, onSelect }: DayTabProps) {
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
      onClick={onSelect}
      {...pointerListenersOnly(handle.listeners)}
      className={cn(
        'flex min-h-11 shrink-0 touch-manipulation flex-col items-start justify-center rounded-xl px-4 py-1.5 text-left transition-colors',
        selected ? 'bg-ink text-white shadow-card' : 'text-fg-muted hover:bg-fg/5 hover:text-fg',
        isDragging && 'opacity-80 shadow-pop',
      )}
    >
      <span className="text-[15px] leading-tight font-semibold whitespace-nowrap">{day.name || 'Día'}</span>
      {day.label.trim() && (
        <span className={cn('text-xs leading-tight whitespace-nowrap', selected ? 'text-brand' : 'text-fg-subtle')}>
          {day.label}
        </span>
      )}
    </button>
  )
}
