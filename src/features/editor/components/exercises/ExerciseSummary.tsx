import { ChevronUp, Eye, Lock, TrendingUp } from 'lucide-react'
import { DropdownMenu, type MenuItem } from '../../../../components/ui'
import { cn } from '../../../../lib/cn'
import { formatEntrySummary } from '../../../../lib/format'
import type { ExerciseEntry } from '../../../../types'
import type { DragHandleBindings } from '../../hooks/useSortableItem'
import { DragHandle } from '../dnd/DragHandle'
import { RowLabel } from './RowLabel'

export interface ExerciseSummaryProps {
  entry: ExerciseEntry
  label: string | null
  showSets: boolean
  /** Current program week (summary shows its progression value). */
  week: number | null
  expanded: boolean
  handle: DragHandleBindings
  menuItems: MenuItem[]
  onToggle: () => void
}

/** 'Sentadilla goblet   4 × 8-10 · KB 16 · desc. 90s' with flags for cue, progression and private note. */
export function ExerciseSummary({ entry, label, showSets, week, expanded, handle, menuItems, onToggle }: ExerciseSummaryProps) {
  const summary = formatEntrySummary(entry, { showSets, week })
  return (
    <div className="flex items-center gap-1 pr-1">
      <DragHandle handle={handle} itemLabel="ejercicio" />
      {label && <RowLabel label={label} />}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex min-h-12 min-w-0 flex-1 flex-col justify-center rounded-lg px-2 py-1.5 text-left"
      >
        <span className={cn('truncate text-[15px] font-medium', entry.name ? 'text-fg' : 'text-fg-subtle italic')}>
          {entry.name || 'Ejercicio sin nombre'}
        </span>
        {summary && <span className="truncate text-sm text-fg-muted tabular">{summary}</span>}
      </button>
      <span className="flex shrink-0 items-center gap-1.5 px-1">
        {entry.cue.trim() && <Eye size={15} aria-label="Tiene indicación para el cliente" className="text-brand-strong" />}
        {entry.progression && <TrendingUp size={15} aria-label="Tiene progresión semanal" className="text-emerald-600" />}
        {entry.internalNote.trim() && <Lock size={15} aria-label="Tiene nota interna" className="text-private-icon" />}
      </span>
      {expanded && <ChevronUp size={18} aria-hidden className="hidden shrink-0 text-fg-subtle md:block" />}
      <DropdownMenu items={menuItems} label="Opciones del ejercicio" />
    </div>
  )
}
