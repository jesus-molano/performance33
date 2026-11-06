import { MonitorPlay } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { formatDayTitle } from '@/lib/format'
import type { Program } from '@/types'
import { ScreenSendButton } from '@/features/screens'
import { formatDayContent } from '@/features/clients/utils/programSummary'

export interface ProgramDayListProps {
  program: Program
  /** 1-based day number. */
  onShowDay: (dayNumber: number) => void
}

/** Days of a routine: 'Pantalla' sends a day to a section of a TV; the other button opens it in a window of its own. */
export function ProgramDayList({ program, onShowDay }: ProgramDayListProps) {
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {program.days.map((day, index) => (
        <li key={day.id} className="flex items-center gap-2 bg-surface py-1.5 pr-1.5 pl-3 sm:gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-brand tabular">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-md font-medium text-fg">{formatDayTitle(day)}</p>
            <p className="truncate text-sm text-fg-muted">{formatDayContent(day)}</p>
          </div>
          <ScreenSendButton clientId={program.clientId} day={index + 1} dayLabel={formatDayTitle(day)} />
          <IconButton icon={MonitorPlay} label={`Abrir ${day.name} en una ventana aparte`} onClick={() => onShowDay(index + 1)} />
        </li>
      ))}
    </ol>
  )
}
