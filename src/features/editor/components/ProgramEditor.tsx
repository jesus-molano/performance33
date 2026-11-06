import { CalendarPlus } from 'lucide-react'
import { useMemo } from 'react'
import { Button, EmptyState } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Client, Program } from '@/types'
import { CompactImportantNotes } from '@/features/clients'
import { useDayActions } from '@/features/editor/hooks/useDayActions'
import { useDiscardEmptyRows } from '@/features/editor/hooks/useDiscardEmptyRows'
import { EditorContext } from '@/features/editor/hooks/useEditorContext'
import { usePreviewPanel } from '@/features/editor/hooks/usePreviewPanel'
import { useProgramHeader } from '@/features/editor/hooks/useProgramHeader'
import { useSelectedDay } from '@/features/editor/hooks/useSelectedDay'
import { useWeekContext } from '@/features/editor/hooks/useWeekContext'
import { dayScreenTarget } from '@/features/editor/utils'
import { DayEditor } from './days/DayEditor'
import { DayTabs } from './days/DayTabs'
import { MobileExerciseSheet } from './exercises/MobileExerciseSheet'
import { ProgramHeader } from './header/ProgramHeader'
import { PreviewAside, PreviewSheet } from './preview/PreviewPanel'

export interface ProgramEditorProps {
  client: Client
  program: Program
}

/** Layout of the editor: header, important notifications, day tabs + selected day, live TV preview on wide screens. */
export function ProgramEditor({ client, program }: ProgramEditorProps) {
  const { day, dayIndex, selectDay } = useSelectedDay(program)
  const dayActions = useDayActions(program, selectDay)
  const preview = usePreviewPanel()
  const weeks = useWeekContext(program)
  const headerApi = useProgramHeader(client, program)
  const context = useMemo(() => ({ days: program.days, weeks }), [program.days, weeks])
  useDiscardEmptyRows()
  const previewProps = { programId: program.id, dayId: day?.id ?? null }
  const screenTarget = dayScreenTarget(client, program, day, dayIndex)

  return (
    <EditorContext value={context}>
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 pb-10 md:px-8 md:pt-6">
        <ProgramHeader
          client={client}
          program={program}
          api={headerApi}
          screenTarget={screenTarget}
          previewVisible={preview.isWide ? preview.showAside : preview.sheetOpen}
          onTogglePreview={preview.toggle}
        />
        <div className="mt-4">
          <CompactImportantNotes clientId={client.id} />
        </div>
        <div className={cn('mt-6 grid items-start gap-8', preview.showAside && 'xl:grid-cols-[minmax(0,1fr)_360px]')}>
          <div className="min-w-0">
            <DayTabs
              days={program.days}
              selectedId={day?.id ?? null}
              onSelect={selectDay}
              onMove={dayActions.moveDay}
              canAdd={dayActions.canAddDay}
              onAdd={dayActions.addDay}
            />
            {day ? (
              <DayEditor
                key={day.id}
                day={day}
                menuItems={dayActions.menuItems(day.id, dayIndex)}
                screenTarget={screenTarget}
              />
            ) : (
              <EmptyState
                icon={CalendarPlus}
                title="Esta rutina no tiene días"
                description="Añade un día por cada sesión semanal del usuario."
                action={<Button onClick={dayActions.addDay}>Añadir día</Button>}
              />
            )}
          </div>
          {preview.showAside && <PreviewAside {...previewProps} />}
        </div>
        <PreviewSheet open={preview.sheetOpen} onClose={preview.closeSheet} {...previewProps} />
        <MobileExerciseSheet program={program} />
      </div>
    </EditorContext>
  )
}
