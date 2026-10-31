import { closestCenter, DndContext, type Announcements, type DragEndEvent } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ReactNode } from 'react'
import { DND_TEXTS } from '@/features/editor/config'
import { useSortableSensors } from '@/features/editor/hooks/useSortableSensors'

const ANNOUNCEMENTS: Announcements = {
  onDragStart: () => DND_TEXTS.start,
  onDragOver: () => DND_TEXTS.over,
  onDragEnd: () => DND_TEXTS.end,
  onDragCancel: () => DND_TEXTS.cancel,
}

export interface SortableListProps {
  ids: string[]
  /** Called once on drop with the dragged id and its new index. */
  onMove: (id: string, toIndex: number) => void
  orientation?: 'vertical' | 'horizontal'
  children: ReactNode
}

/** Drag-and-drop context for one reorderable list (days, blocks of a day, rows of a block). */
export function SortableList({ ids, onMove, orientation = 'vertical', children }: SortableListProps) {
  const sensors = useSortableSensors()
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const toIndex = ids.indexOf(String(over.id))
    if (toIndex !== -1) onMove(String(active.id), toIndex)
  }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements: ANNOUNCEMENTS, screenReaderInstructions: { draggable: DND_TEXTS.instructions } }}
    >
      <SortableContext
        items={ids}
        strategy={orientation === 'vertical' ? verticalListSortingStrategy : horizontalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  )
}
