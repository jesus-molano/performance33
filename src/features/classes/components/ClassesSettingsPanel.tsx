import { CalendarX, Lock } from 'lucide-react'
import { Button, Callout, EmptyState } from '@/components/ui'
import { useIsAdmin } from '@/store'
import { CLASSES_COPY, SCHEDULE_COPY } from '@/features/classes/config/copy'
import { useBookingRulesEditor } from '@/features/classes/hooks/useBookingRulesEditor'
import { useClassSchedule } from '@/features/classes/hooks/useClassesData'
import type { ClassSchedule } from '@/features/classes/types'
import { BookingRulesSection } from './BookingRulesSection'
import { PlanQuotaSection } from './PlanQuotaSection'
import { WeeklySchedule } from './WeeklySchedule'

function Sections({ schedule, canEdit }: { schedule: ClassSchedule; canEdit: boolean }) {
  const editor = useBookingRulesEditor(schedule.settings)
  return (
    <>
      <WeeklySchedule templates={schedule.templates} canEdit={canEdit} />
      <BookingRulesSection editor={editor} canEdit={canEdit} />
      <PlanQuotaSection editor={editor} canEdit={canEdit} />
    </>
  )
}

/** Ajustes → Clases: the timetable, the booking rules and the classes of each plan. Monitors only read it. */
export function ClassesSettingsPanel() {
  const canEdit = useIsAdmin()
  const { status, data, retry } = useClassSchedule()
  return (
    <div className="flex flex-col gap-6">
      {!canEdit && (
        <Callout icon={Lock}>
          {SCHEDULE_COPY.readOnly}
        </Callout>
      )}
      {data ? (
        <Sections schedule={data} canEdit={canEdit} />
      ) : status === 'error' ? (
        <EmptyState icon={CalendarX} title={CLASSES_COPY.loadFailed} action={<Button onClick={retry}>{CLASSES_COPY.retry}</Button>} />
      ) : (
        <p className="py-10 text-center text-md text-fg-muted">{CLASSES_COPY.loading}</p>
      )}
    </div>
  )
}
