import { closestCenter, DndContext } from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { emptyGridCells, gridFor } from '@/features/screens'
import { useTvColumnSort } from '@/features/display/hooks/useTvColumnSort'
import { TV_DND_TEXTS, TV_SECTION_GAP } from '@/features/display/config/tv'

interface TvColumnsProps {
  ids: string[]
  onMove: (from: number, to: number) => void
  /** Theme colour of the gap between sections (DisplayThemeClasses.sectionGutter). */
  gutterClassName: string
  /** Background of a grid cell no section uses (5 sections in 3 × 2), so it reads as empty space, not a grey block. */
  fillerClassName: string
  children: ReactNode
}

/**
 * The sections of a TV (1-3 side by side, 4 in 2 × 2, 5-6 in 3 × 2), reordered by their grips. Between them a gutter in
 * the theme's gutter colour, so each person's part reads as its own.
 */
export function TvColumns({ ids, onMove, gutterClassName, fillerClassName, children }: TvColumnsProps) {
  const { sensors, announcements, onDragEnd } = useTvColumnSort(ids, onMove)
  const { columns, rows } = gridFor(ids.length)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements, screenReaderInstructions: { draggable: TV_DND_TEXTS.instructions } }}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div
          className={cn('grid h-full', gutterClassName)}
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            gap: TV_SECTION_GAP,
          }}
        >
          {children}
          {Array.from({ length: emptyGridCells(ids.length) }, (_, i) => (
            <div key={`empty-${i}`} aria-hidden className={fillerClassName} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
