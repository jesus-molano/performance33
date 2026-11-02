import { cn } from '@/lib/cn'
import type { Day } from '@/types'
import { pointerListenersOnly, useSortableItem } from '@/features/editor/hooks/useSortableItem'

export interface DayTabProps {
  day: Day
  selected: boolean
  onSelect: () => void
}

/**
 * One named day. Mouse/touch can drag it directly (activation distance/delay keeps clicks working);
 * keyboard users reorder with the day '⋯' menu, so Enter/Space keep selecting the tab.
 * Tabs share the row and shorten their names; the tooltip has it all.
 */
export function DayTab({ day, selected, onSelect }: DayTabProps) {
  const { setNodeRef, style, isDragging, handle } = useSortableItem(day.id)
  const name = day.name || 'Día'
  const label = day.label.trim()
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
      title={label ? `${name} · ${label}` : name}
      onClick={onSelect}
      onContextMenu={(event) => event.preventDefault()}
      {...pointerListenersOnly(handle.listeners)}
      className={cn(
        'flex min-h-11 max-w-56 min-w-0 flex-1 touch-manipulation flex-col items-start justify-center rounded-xl px-2 py-1.5 text-left lg:px-3 transition-colors select-none [-webkit-touch-callout:none]',
        selected ? 'bg-ink text-white shadow-card' : 'text-fg-muted hover:bg-fg/5 hover:text-fg',
        isDragging && 'opacity-80 shadow-pop',
      )}
    >
      <span className="w-full truncate text-md leading-tight font-semibold">{name}</span>
      {label && <span className={cn('w-full truncate text-xs leading-tight', selected ? 'text-brand' : 'text-fg-subtle')}>{label}</span>}
    </button>
  )
}
