// Putting people in a class, taking them out and moving them, each with "Deshacer" (also Ctrl+Z while the toast is up).

import { useMemo } from 'react'
import { ACTION_COPY } from '@/features/classes/config/copy'
import { classesService } from '@/features/classes/services/instance'
import type { SlotSummary } from '@/features/classes/types'
import type { RosterClient, RosterEntry } from '@/features/classes/utils/slotView'
import { formatGymTime } from '@/features/classes/utils/time'
import { useClassRunner } from './useClassRunner'

export interface BookingActions {
  /** True when the person got the place. */
  add: (slot: SlotSummary, client: RosterClient) => Promise<boolean>
  remove: (slot: SlotSummary, entry: RosterEntry) => Promise<void>
  move: (from: SlotSummary, entry: RosterEntry, to: SlotSummary) => Promise<boolean>
}

const withNotes = (message: string, ...notes: (string | false)[]) => [message, ...notes.filter(Boolean)].join(' · ')

const firstNameOf = (entry: RosterEntry) => entry.client?.firstName ?? entry.name

export function useBookingActions(): BookingActions {
  const { run, runWithFullCheck, toast } = useClassRunner()
  const { toastUndoAction } = toast

  return useMemo(
    () => ({
      async add(slot, client) {
        const result = await runWithFullCheck(slot, client.firstName, (force) => classesService.addBooking(slot.id, client.id, force))
        if (!result) return false
        toastUndoAction({
          message: withNotes(ACTION_COPY.added(client.firstName, formatGymTime(slot.startsAt)), result.overQuota && ACTION_COPY.overQuota),
          onUndo: () => void run(() => classesService.removeBooking(result.bookingId)),
        })
        return true
      },

      async remove(slot, entry) {
        const result = await run(() => classesService.removeBooking(entry.booking.id))
        if (!result) return
        toastUndoAction({
          message: withNotes(ACTION_COPY.removed(firstNameOf(entry), formatGymTime(slot.startsAt)), result.promoted > 0 && ACTION_COPY.promoted(result.promoted)),
          onUndo: () => void run(() => classesService.addBooking(slot.id, entry.booking.clientId, true)),
        })
      },

      async move(from, entry, to) {
        const name = firstNameOf(entry)
        const result = await runWithFullCheck(to, name, (force) => classesService.moveBooking(entry.booking.id, to.id, force))
        if (!result) return false
        toastUndoAction({
          message: withNotes(ACTION_COPY.moved(name, formatGymTime(to.startsAt)), result.overQuota && ACTION_COPY.overQuota),
          onUndo: () => void run(() => classesService.moveBooking(result.bookingId, from.id, true)),
        })
        return true
      },
    }),
    [run, runWithFullCheck, toastUndoAction],
  )
}
