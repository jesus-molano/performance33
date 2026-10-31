import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { DragHandleBindings } from '@/features/editor/hooks/useSortableItem'

export interface DragHandleProps {
  handle: DragHandleBindings
  /** What is being dragged, for the accessible label: 'ejercicio', 'bloque', 'día'. */
  itemLabel: string
  tone?: 'light' | 'dark'
  className?: string
}

/** ⋮⋮ grip. Drags start only here (touch-action none) so the rest of the item scrolls normally. */
export function DragHandle({ handle: { setActivator, attributes, listeners }, itemLabel, tone = 'light', className }: DragHandleProps) {
  return (
    <button
      type="button"
      ref={setActivator}
      {...attributes}
      {...listeners}
      aria-label={`Arrastrar ${itemLabel} para reordenar`}
      title="Arrastra para reordenar"
      className={cn(
        'inline-flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg active:cursor-grabbing md:size-9',
        tone === 'light' ? 'text-fg-subtle hover:bg-fg/5 hover:text-fg-muted' : 'text-ink-muted hover:text-white',
        className,
      )}
    >
      <GripVertical size={18} aria-hidden />
    </button>
  )
}
