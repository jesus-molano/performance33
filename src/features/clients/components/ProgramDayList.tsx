import { MonitorPlay } from 'lucide-react'
import { IconButton } from '../../../components/ui'
import { formatDayTitle } from '../../../lib/format'
import type { Program } from '../../../types'
import { formatDayContent } from '../utils/programSummary'

export interface ProgramDayListProps {
  program: Program
  /** 1-based day number. */
  onShowDay: (dayNumber: number) => void
}

/** Days of a routine with a per-day 'open on screen' button. */
export function ProgramDayList({ program, onShowDay }: ProgramDayListProps) {
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {program.days.map((day, index) => (
        <li key={day.id} className="flex items-center gap-3 bg-surface py-1.5 pr-1.5 pl-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-brand tabular">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-fg">{formatDayTitle(day)}</p>
            <p className="truncate text-sm text-fg-muted">{formatDayContent(day)}</p>
          </div>
          <IconButton icon={MonitorPlay} label={`Abrir ${day.name} en pantalla`} onClick={() => onShowDay(index + 1)} />
        </li>
      ))}
    </ol>
  )
}
