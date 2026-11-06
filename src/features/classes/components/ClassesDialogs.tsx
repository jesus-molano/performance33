import type { ClassesPageApi } from '@/features/classes/hooks/useClassesPage'
import { buildRoster } from '@/features/classes/utils/slotView'
import { useRosterClients } from '@/features/classes/hooks/useClassesData'
import { AddPersonModal } from './AddPersonModal'
import { MoveBookingModal } from './MoveBookingModal'
import { SlotFormModal } from './SlotFormModal'

/** The dialog open on the Clases page, always on the live class (it closes if the class goes away). */
export function ClassesDialogs({ page }: { page: ClassesPageApi }) {
  const clients = useRosterClients()
  const { dialog, closeDialog, date, now } = page
  if (!dialog) return null
  const bookings = page.day.data?.bookings ?? []

  if (dialog.kind === 'create') {
    return (
      <SlotFormModal
        slot={null}
        date={date}
        now={now}
        onClose={closeDialog}
        onCreated={(slotId) => {
          closeDialog()
          page.select(slotId)
        }}
      />
    )
  }
  const slot = page.slotById(dialog.slotId)
  if (!slot) return null
  if (dialog.kind === 'edit') return <SlotFormModal slot={slot} date={slot.gymDate} now={now} onClose={closeDialog} onCreated={closeDialog} />
  if (dialog.kind === 'add') return <AddPersonModal slot={slot} bookings={bookings} onClose={closeDialog} />

  const { booked, waitlist } = buildRoster(bookings, slot.id, clients)
  const entry = [...booked, ...waitlist].find((e) => e.booking.id === dialog.bookingId)
  return entry ? <MoveBookingModal from={slot} entry={entry} now={now} onClose={closeDialog} /> : null
}
