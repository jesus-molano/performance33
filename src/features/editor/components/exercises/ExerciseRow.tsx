import type { KeyboardEvent } from 'react'
import { useIsMobile } from '../../../../hooks'
import { cn } from '../../../../lib/cn'
import type { ExerciseEntry } from '../../../../types'
import { useExerciseRowActions } from '../../hooks/useExerciseRowActions'
import { useSortableItem } from '../../hooks/useSortableItem'
import { useEditorUi } from '../../state/editorUiStore'
import type { WeekContext } from '../../types'
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
  weeks: WeekContext
}

/** Compact line; on desktop it expands in place, on mobile it opens the bottom sheet editor. */
export function ExerciseRow({ entry, index, count, blockId, label, showSets, weeks }: ExerciseRowProps) {
  const { setNodeRef, style, isDragging, handle } = useSortableItem(entry.id)
  const isMobile = useIsMobile()
  const isOpen = useEditorUi((s) => s.expandedExerciseId === entry.id)
  const openRow = useEditorUi((s) => s.openRow)
  const closeRow = useEditorUi((s) => s.closeRow)
  const menuItems = useExerciseRowActions(entry.id, blockId, index, count)
  const expanded = isOpen && !isMobile

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !event.defaultPrevented) closeRow()
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl transition-colors',
        expanded ? 'bg-surface shadow-card ring-2 ring-brand-strong/25' : 'hover:bg-canvas',
        isDragging && 'bg-surface shadow-pop',
      )}
    >
      <ExerciseSummary
        entry={entry}
        label={label}
        showSets={showSets}
        week={weeks.current}
        expanded={expanded}
        handle={handle}
        menuItems={menuItems}
        onToggle={() => (expanded ? closeRow() : openRow(entry.id))}
      />
      {expanded && (
        <div className="animate-fade-in px-2 pt-1 pb-3 md:px-3" onKeyDown={onKeyDown}>
          <ExerciseEditor entry={entry} blockId={blockId} index={index} showSets={showSets} weeks={weeks} />
        </div>
      )}
    </li>
  )
}
