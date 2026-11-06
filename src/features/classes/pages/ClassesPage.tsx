import { CalendarPlus, CalendarX } from 'lucide-react'
import { Button, Card, EmptyState } from '@/components/ui'
import { PageContainer, PageHeader } from '@/features/shell'
import { DayNavigator } from '@/features/classes/components/DayNavigator'
import { ClassesDialogs } from '@/features/classes/components/ClassesDialogs'
import { SlotCard } from '@/features/classes/components/SlotCard'
import { SlotRoster } from '@/features/classes/components/SlotRoster'
import { CLASSES_COPY } from '@/features/classes/config/copy'
import { useClassesPage, type ClassesPageApi } from '@/features/classes/hooks/useClassesPage'
import type { SlotSummary } from '@/features/classes/types'

export interface ClassesPageProps {
  /** `?dia=` of the address (YYYY-MM-DD); null or not a date = today. */
  day: string | null
}

function Roster({ page, slot, showHead }: { page: ClassesPageApi; slot: SlotSummary; showHead: boolean }) {
  return (
    <SlotRoster
      slot={slot}
      bookings={page.day.data?.bookings ?? []}
      now={page.now}
      showHead={showHead}
      onAddPerson={() => page.openDialog({ kind: 'add', slotId: slot.id })}
      onEdit={() => page.openDialog({ kind: 'edit', slotId: slot.id })}
      onMove={(entry) => page.openDialog({ kind: 'move', slotId: slot.id, bookingId: entry.booking.id })}
    />
  )
}

function DayStatus({ page }: { page: ClassesPageApi }) {
  if (page.day.status === 'error') {
    return (
      <EmptyState
        icon={CalendarX}
        title={CLASSES_COPY.loadFailed}
        action={<Button onClick={page.day.retry}>{CLASSES_COPY.retry}</Button>}
      />
    )
  }
  return <p className="py-10 text-center text-md text-fg-muted">{CLASSES_COPY.loading}</p>
}

/** Clases: one gym day, its classes and who comes to each. Laptop: the people of the picked class beside the list. */
export function ClassesPage({ day }: ClassesPageProps) {
  const page = useClassesPage(day)
  const { slots, selected, twoPanes, isPast } = page
  const addSlot = isPast ? null : (
    <Button variant="secondary" leftIcon={CalendarPlus} onClick={() => page.openDialog({ kind: 'create' })} fullWidth={!twoPanes}>
      {CLASSES_COPY.addSlot}
    </Button>
  )

  return (
    <PageContainer>
      <PageHeader title={CLASSES_COPY.title} description={CLASSES_COPY.description} />
      <DayNavigator date={page.date} today={page.today} onChange={page.goTo} />
      {!page.day.data ? (
        <DayStatus page={page} />
      ) : slots.length === 0 ? (
        isPast ? (
        <EmptyState icon={CalendarX} title={CLASSES_COPY.noClassesPast} />
      ) : (
        <EmptyState icon={CalendarX} title={CLASSES_COPY.noClasses} description={CLASSES_COPY.noClassesHint} action={addSlot} />
      )
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <div className="flex flex-col gap-3">
            {slots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} now={page.now} selected={selected?.id === slot.id} onSelect={() => page.select(slot.id)} expands={!twoPanes}>
                {!twoPanes && selected?.id === slot.id && <Roster page={page} slot={slot} showHead={false} />}
              </SlotCard>
            ))}
            {addSlot && <div className="mt-2">{addSlot}</div>}
          </div>
          {twoPanes && (
            <Card padding="lg" className="sticky top-[calc(var(--spacing-header)+1.5rem)]">
              {selected ? <Roster page={page} slot={selected} showHead /> : <p className="text-md text-fg-muted">{CLASSES_COPY.pickSlot}</p>}
            </Card>
          )}
        </div>
      )}
      <ClassesDialogs page={page} />
    </PageContainer>
  )
}
