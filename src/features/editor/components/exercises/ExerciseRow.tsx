import { cn } from '@/lib/cn'
import type { ExerciseEntry } from '@/types'
import { useEditorContext } from '@/features/editor/hooks/useEditorContext'
import { useExerciseRowActions } from '@/features/editor/hooks/useExerciseRowActions'
import { useRowExpansion } from '@/features/editor/hooks/useRowExpansion'
import { useSortableItem } from '@/features/editor/hooks/useSortableItem'
import { ExerciseEditor } from './ExerciseEditor'
import { ExerciseSummary } from './ExerciseSummary'

export interface ExerciseRowProps {
  entry: ExerciseEntry
  index: number
  count: number
  blockId: string
  /** 'A1', '1', 'Min 1' or null (derived from position). */
  label: string | null
  showSets: boolean
}

/** Compact line; on desktop it expands in place, on mobile it opens the bottom sheet editor. */
export function ExerciseRow({ entry, index, count, blockId, label, showSets }: ExerciseRowProps) {
  const { setNodeRef, style, isDragging, handle } = useSortableItem(entry.id)
  const { weeks } = useEditorContext()
  const row = useRowExpansion(entry.id)
  const menuItems = useExerciseRowActions(entry.id, blockId, index, count)

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl transition-colors',
        row.expanded ? 'bg-surface shadow-card ring-2 ring-brand-strong/25' : 'hover:bg-canvas',
        isDragging && 'bg-surface shadow-pop',
      )}
    >
      <ExerciseSummary
        entry={entry}
        label={label}
        showSets={showSets}
        week={weeks.current}
        expanded={row.expanded}
        handle={handle}
        menuItems={menuItems}
        onToggle={row.toggle}
        toggleRef={row.toggleRef}
      />
      {row.expanded && (
        <div className="animate-fade-in px-2 pt-1 pb-3 md:px-3" onKeyDown={row.onKeyDown}>
          <ExerciseEditor entry={entry} blockId={blockId} index={index} showSets={showSets} />
        </div>
      )}
    </li>
  )
}
