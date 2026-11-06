// Changing a class: open or close its bookings, edit it, cancel it (asked first, final), or add a one-off class.

import { useMemo } from 'react'
import { gymTimeToMs, type GymDate } from '@shared/booking'
import { useConfirm } from '@/hooks'
import { ACTION_COPY } from '@/features/classes/config/copy'
import { classesService } from '@/features/classes/services/instance'
import type { SlotSummary } from '@/features/classes/types'
import { slotPatchFrom, type ValidClassForm } from '@/features/classes/utils/classForm'
import { formatGymTime } from '@/features/classes/utils/time'
import { useClassRunner } from './useClassRunner'

export interface SlotActions {
  setOpen: (slot: SlotSummary, open: boolean) => Promise<void>
  cancel: (slot: SlotSummary) => Promise<void>
  /** True when saved. */
  save: (slot: SlotSummary, values: ValidClassForm) => Promise<boolean>
  /** The new class id, or null. */
  create: (date: GymDate, values: ValidClassForm) => Promise<string | null>
}

export function useSlotActions(): SlotActions {
  const { run, toast } = useClassRunner()
  const confirm = useConfirm()
  const { toast: show } = toast

  return useMemo(
    () => ({
      async setOpen(slot, open) {
        const result = await run(() => classesService.updateSlot(slot.id, { status: open ? 'open' : 'closed' }))
        if (!result) return
        const message = open ? ACTION_COPY.opened : ACTION_COPY.closed
        show({ message: result.promoted ? `${message} · ${ACTION_COPY.promoted(result.promoted)}` : message })
      },

      async cancel(slot) {
        const time = formatGymTime(slot.startsAt)
        const confirmed = await confirm({
          title: ACTION_COPY.cancelTitle(time),
          description: ACTION_COPY.cancelText(slot.bookedCount + slot.waitlistCount),
          confirmLabel: ACTION_COPY.cancelConfirm,
          cancelLabel: ACTION_COPY.cancelBack,
          danger: true,
        })
        if (!confirmed) return
        if (await run(() => classesService.updateSlot(slot.id, { status: 'cancelled' }))) show({ message: ACTION_COPY.cancelled(time) })
      },

      async save(slot, values) {
        const patch = slotPatchFrom(slot, values)
        if (!Object.keys(patch).length) return true
        const result = await run(() => classesService.updateSlot(slot.id, patch))
        if (result) show({ message: result.promoted ? `${ACTION_COPY.saved} · ${ACTION_COPY.promoted(result.promoted)}` : ACTION_COPY.saved })
        return result !== null
      },

      async create(date, values) {
        const startsAt = gymTimeToMs(date, values.startMinutes)
        const id = await run(() => classesService.createSlot({ ...values, startsAt }))
        if (id) show({ message: ACTION_COPY.created(formatGymTime(startsAt)) })
        return id
      },
    }),
    [run, show, confirm],
  )
}
