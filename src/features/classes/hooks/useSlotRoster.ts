// The people of one class and what a coach can do with the class and with each person in it.

import { ArrowRightLeft, Ban, Lock, LockOpen, Pencil, UserMinus } from 'lucide-react'
import { useMemo } from 'react'
import type { MenuItem } from '@/components/ui'
import { ROSTER_COPY } from '@/features/classes/config/copy'
import type { Booking, SlotSummary } from '@/features/classes/types'
import { buildRoster, canManageSlot, staffSlotState, type Roster, type RosterEntry, type StaffSlotState } from '@/features/classes/utils/slotView'
import { useBookingActions } from './useBookingActions'
import { useRosterClients } from './useClassesData'
import { useSlotActions } from './useSlotActions'

export interface SlotRosterHandlers {
  onEdit: () => void
  onMove: (entry: RosterEntry) => void
}

export interface SlotRosterApi {
  state: StaffSlotState
  roster: Roster
  canManage: boolean
  /** A line under the head for closed, cancelled or finished classes. */
  note: string | null
  slotMenu: MenuItem[]
  personMenu: (entry: RosterEntry) => MenuItem[]
}

const NOTES: Partial<Record<StaffSlotState, string>> = {
  closed: ROSTER_COPY.closedNote,
  cancelled: ROSTER_COPY.cancelledNote,
  finished: ROSTER_COPY.finishedNote,
}

export function useSlotRoster(slot: SlotSummary, bookings: readonly Booking[], now: number, handlers: SlotRosterHandlers): SlotRosterApi {
  const clients = useRosterClients()
  const bookingActions = useBookingActions()
  const slotActions = useSlotActions()
  const state = staffSlotState(slot, now)
  const canManage = canManageSlot(state)
  const roster = useMemo(() => buildRoster(bookings, slot.id, clients), [bookings, slot.id, clients])
  const { onEdit, onMove } = handlers

  const slotMenu: MenuItem[] = canManage
    ? [
        { label: ROSTER_COPY.edit, icon: Pencil, onSelect: onEdit },
        slot.status === 'closed'
          ? { label: ROSTER_COPY.open, icon: LockOpen, onSelect: () => void slotActions.setOpen(slot, true) }
          : { label: ROSTER_COPY.close, icon: Lock, onSelect: () => void slotActions.setOpen(slot, false) },
        'separator',
        { label: ROSTER_COPY.cancel, icon: Ban, danger: true, onSelect: () => void slotActions.cancel(slot) },
      ]
    : []

  const personMenu = (entry: RosterEntry): MenuItem[] =>
    canManage
      ? [
          { label: ROSTER_COPY.move, icon: ArrowRightLeft, onSelect: () => onMove(entry) },
          { label: ROSTER_COPY.remove, icon: UserMinus, danger: true, onSelect: () => void bookingActions.remove(slot, entry) },
        ]
      : []

  return { state, roster, canManage, note: NOTES[state] ?? null, slotMenu, personMenu }
}
