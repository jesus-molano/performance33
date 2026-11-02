import { DateField } from '@/components/ui'
import { MAX_PROGRAM_WEEKS } from '@/config/app'
import { endDateFor } from '@/lib/dates'
import type { Program } from '@/types'
import { DATE_ROW_CLASSES } from '@/features/editor/config'
import type { ProgramHeaderApi } from '@/features/editor/hooks/useProgramHeader'
import { WeeksStepper } from './WeeksStepper'

export interface ProgramDatesEditorProps {
  program: Program
  api: Pick<ProgramHeaderApi, 'setStartDate' | 'setEndDate' | 'setWeeks'>
}

/** Start date · weeks · end date: one row each on phones. Changing one keeps the other two consistent. */
export function ProgramDatesEditor({ program, api }: ProgramDatesEditorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <DateField
        label="Empieza"
        value={program.startDate}
        onChange={(date) => date && api.setStartDate(date)}
        containerClassName={DATE_ROW_CLASSES}
      />
      <WeeksStepper value={program.weeks} onChange={api.setWeeks} />
      <DateField
        label="Termina"
        min={program.startDate}
        max={endDateFor(program.startDate, MAX_PROGRAM_WEEKS)}
        value={program.endDate}
        onChange={(date) => date && api.setEndDate(date)}
        containerClassName={DATE_ROW_CLASSES}
      />
    </div>
  )
}
