import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties } from 'react'

export interface DragHandleBindings {
  setActivator: (element: HTMLElement | null) => void
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
}

export interface SortableItem {
  setNodeRef: (element: HTMLElement | null) => void
  style: CSSProperties
  isDragging: boolean
  /** Spread on the drag handle only (so the rest of the item scrolls and clicks normally). */
  handle: DragHandleBindings
}

/** Drag listeners without the keyboard one, for items whose Enter/Space must keep their own action. */
export function pointerListenersOnly(listeners: DraggableSyntheticListeners): DraggableSyntheticListeners {
  if (!listeners) return listeners
  return Object.fromEntries(Object.entries(listeners).filter(([event]) => event !== 'onKeyDown'))
}

export function useSortableItem(id: string): SortableItem {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id })
  return {
    setNodeRef,
    style: {
      transform: CSS.Translate.toString(transform),
      transition,
      position: 'relative',
      zIndex: isDragging ? 20 : undefined,
    },
    isDragging,
    handle: { setActivator: setActivatorNodeRef, attributes, listeners },
  }
}
