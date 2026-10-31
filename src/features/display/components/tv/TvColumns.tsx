import { closestCenter, DndContext } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useTvColumnSort } from '@/features/display/hooks/useTvColumnSort'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { TV_DND_TEXTS } from '@/features/display/config/tv'

interface TvColumnsProps {
  ids: string[]
  theme: DisplayThemeClasses
  onMove: (from: number, to: number) => void
  children: ReactNode
}

/** Equal-width TV columns that can be reordered by their grips (pointer or keyboard). */
export function TvColumns({ ids, theme, onMove, children }: TvColumnsProps) {
  const { sensors, announcements, onDragEnd } = useTvColumnSort(ids, onMove)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements, screenReaderInstructions: { draggable: TV_DND_TEXTS.instructions } }}
    >
      <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
        <div
          className={cn('grid h-full grid-rows-[minmax(0,1fr)] divide-x-2', theme.columnDivider)}
          style={{ gridTemplateColumns: `repeat(${ids.length}, minmax(0, 1fr))` }}
        >
          {children}
        </div>
      </SortableContext>
    </DndContext>
  )
}
