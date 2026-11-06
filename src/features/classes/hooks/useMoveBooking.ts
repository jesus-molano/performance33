// "Mover a otra clase": the classes of any day (the same day first) and the move, asking first when the new one is full.

import { useState } from 'react'
import { addGymDays, type GymDate } from '@shared/booking'
import type { ClassDay, SlotSummary } from '@/features/classes/types'
import { moveTargets, type MoveTarget, type RosterEntry } from '@/features/classes/utils/slotView'
import { useBookingActions } from './useBookingActions'
import { useClassDay, type Loaded } from './useClassesData'

export interface MoveBooking {
  date: GymDate
  shiftDay: (days: number) => void
  day: Loaded<ClassDay>
  targets: MoveTarget[]
  busy: boolean
  moveTo: (slot: SlotSummary) => void
}

export function useMoveBooking(from: SlotSummary, entry: RosterEntry, now: number, onMoved: () => void): MoveBooking {
  const [date, setDate] = useState(from.gymDate)
  const [busy, setBusy] = useState(false)
  const day = useClassDay(date)
  const { move } = useBookingActions()

  const targets = moveTargets(day.data?.slots ?? [], day.data?.bookings ?? [], from.id, entry.booking.clientId, now)

  return {
    date,
    shiftDay: (days) => setDate((current) => addGymDays(current, days)),
    day,
    targets,
    busy,
    moveTo: (slot) => {
      if (busy) return
      setBusy(true)
      void move(from, entry, slot)
        .then((moved) => {
          if (moved) onMoved()
        })
        .finally(() => setBusy(false))
    },
  }
}
