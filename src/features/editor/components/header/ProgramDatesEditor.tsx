import { CalendarDays } from 'lucide-react'
import { Input } from '../../../../components/ui'
import { formatDateRange } from '../../../../lib/dates'
import type { Program } from '../../../../types'
import type { ProgramHeaderApi } from '../../hooks/useProgramHeader'
import { WeeksStepper } from './WeeksStepper'

export interface ProgramDatesEditorProps {
  program: Program
  api: Pick<ProgramHeaderApi, 'setStartDate' | 'setEndDate' | 'setWeeks'>
}

/** Start date · weeks · end date. Changing one keeps the other two consistent. */
export function ProgramDatesEditor({ program, api }: ProgramDatesEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Input
          type="date"
          label="Empieza"
          value={program.startDate}
          onChange={(e) => e.target.value && api.setStartDate(e.target.value)}
        />
        <div className="order-last col-span-2 sm:order-none sm:col-span-1">
          <WeeksStepper value={program.weeks} onChange={api.setWeeks} />
        </div>
        <Input
          type="date"
          label="Termina"
          min={program.startDate}
          value={program.endDate}
          onChange={(e) => e.target.value && api.setEndDate(e.target.value)}
        />
      </div>
      <p className="flex items-center gap-1.5 text-sm text-fg-muted">
        <CalendarDays size={15} aria-hidden />
        {formatDateRange(program.startDate, program.endDate)} · {program.weeks}{' '}
        {program.weeks === 1 ? 'semana' : 'semanas'}
      </p>
    </div>
  )
}
