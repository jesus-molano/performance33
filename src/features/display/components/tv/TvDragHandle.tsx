import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { TvDragHandleBindings } from '@/features/display/hooks/useTvSortableSlot'

interface TvDragHandleProps {
  handle: TvDragHandleBindings
  label: string
  hidden: boolean
}

/** Grip to drag (or Space + arrows) a TV column to another position. */
export function TvDragHandle({ handle: { setActivator, attributes, listeners }, label, hidden }: TvDragHandleProps) {
  return (
    <button
      type="button"
      ref={setActivator}
      {...attributes}
      {...listeners}
      aria-label={label}
      title={label}
      tabIndex={hidden ? -1 : attributes.tabIndex}
      className={cn(
        'inline-flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-full transition-colors hover:bg-current/15 active:cursor-grabbing',
        hidden && 'invisible',
      )}
    >
      <GripVertical size={22} aria-hidden />
    </button>
  )
}
