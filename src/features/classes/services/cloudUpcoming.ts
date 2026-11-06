// The user's next classes from the cloud rows: their bookings with the class embedded, and the waitlists they are in.

import { slotEndMs, type BookingRow, type ClassSlotRow } from '@shared/booking'
import type { UpcomingClass } from '@/features/classes/types'
import { bookingFromRow, slotFromRow } from '@/features/classes/utils/rows'

type SlotFields = Pick<ClassSlotRow, 'id' | 'template_id' | 'starts_at' | 'gym_date' | 'duration_minutes' | 'capacity' | 'name' | 'status' | 'edited'>

export type CloudUpcomingRow = Pick<BookingRow, 'id' | 'slot_id' | 'client_id' | 'status' | 'forced' | 'queue_order'> & {
  class_slots: SlotFields
}

/** Classes that have not ended, soonest first, each waitlisted one with its place in the queue. */
export function upcomingFrom(
  rows: readonly CloudUpcomingRow[],
  waitlists: readonly Pick<BookingRow, 'slot_id' | 'queue_order'>[],
  now: number,
): UpcomingClass[] {
  return rows
    .flatMap((row) => {
      const booking = bookingFromRow(row)
      const slot = slotFromRow(row.class_slots)
      if (!booking || slotEndMs(slot) <= now) return []
      const ahead = waitlists.filter((w) => w.slot_id === row.slot_id && Number(w.queue_order) < booking.queueOrder).length
      return [{ bookingId: booking.id, slot, status: booking.status, waitlistPosition: booking.status === 'waitlisted' ? ahead + 1 : null }]
    })
    .sort((a, b) => a.slot.startsAt - b.slot.startsAt)
}
