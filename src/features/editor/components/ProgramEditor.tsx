import { CalendarPlus } from 'lucide-react'
import { Button, EmptyState } from '../../../components/ui'
import { cn } from '../../../lib/cn'
import type { Client, Program } from '../../../types'
import { useDayActions } from '../hooks/useDayActions'
import { usePreviewPanel } from '../hooks/usePreviewPanel'
import { useProgramHeader } from '../hooks/useProgramHeader'
import { useSelectedDay } from '../hooks/useSelectedDay'
import { useWeekContext } from '../hooks/useWeekContext'
import { DayEditor } from './days/DayEditor'
import { DayTabs } from './days/DayTabs'
import { MobileExerciseSheet } from './exercises/MobileExerciseSheet'
import { ProgramHeader } from './header/ProgramHeader'
import { PreviewAside, PreviewSheet } from './preview/PreviewPanel'

export interface ProgramEditorProps {
  client: Client
  program: Program
}

/** Layout of the editor: header, day tabs + selected day, live TV preview on wide screens. */
export function ProgramEditor({ client, program }: ProgramEditorProps) {
  const { day, dayIndex, selectDay } = useSelectedDay(program)
  const dayActions = useDayActions(program, selectDay)
  const preview = usePreviewPanel()
  const weeks = useWeekContext(program)
  const headerApi = useProgramHeader(client, program)
  const previewProps = { programId: program.id, dayId: day?.id ?? null, onOpenScreen: () => headerApi.openOnScreen(dayIndex) }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 pb-10 md:px-8 md:pt-6">
      <ProgramHeader
        client={client}
        program={program}
        api={headerApi}
        dayIndex={dayIndex}
        previewVisible={preview.isWide ? preview.showAside : preview.sheetOpen}
        onTogglePreview={preview.toggle}
      />
      <div className={cn('mt-6 grid items-start gap-8', preview.showAside && 'xl:grid-cols-[minmax(0,1fr)_360px]')}>
        <div className="min-w-0">
          <DayTabs
            days={program.days}
            selectedId={day?.id ?? null}
            onSelect={selectDay}
            onMove={dayActions.moveDay}
            onAdd={dayActions.addDay}
          />
          {day ? (
            <DayEditor key={day.id} day={day} days={program.days} weeks={weeks} menuItems={dayActions.menuItems(day.id, dayIndex)} />
          ) : (
            <EmptyState
              icon={CalendarPlus}
              title="Esta rutina no tiene días"
              description="Añade un día por cada sesión semanal del cliente."
              action={<Button onClick={dayActions.addDay}>Añadir día</Button>}
            />
          )}
        </div>
        {preview.showAside && <PreviewAside {...previewProps} />}
      </div>
      <PreviewSheet open={preview.sheetOpen} onClose={preview.closeSheet} {...previewProps} />
      <MobileExerciseSheet program={program} weeks={weeks} />
    </div>
  )
}
