import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties } from 'react'

export interface TvDragHandleBindings {
  setActivator: (element: HTMLElement | null) => void
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
}

export interface TvSortableSlot {
  setNodeRef: (element: HTMLElement | null) => void
  style: CSSProperties
  isDragging: boolean
  /** Spread on the grip only: the rest of the column keeps its pickers and double-click. */
  handle: TvDragHandleBindings
}

/** One sortable TV column; `id` is its stable column id (it follows the column when it moves). */
export function useTvSortableSlot(id: string): TvSortableSlot {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
  })
  return {
    setNodeRef,
    style: { transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 20 : undefined },
    isDragging,
    handle: { setActivator: setActivatorNodeRef, attributes, listeners },
  }
}
