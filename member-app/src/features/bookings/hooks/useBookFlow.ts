import { useState } from 'react'
import type { ClassSlotListRow } from '@shared/booking/rpc.ts'
import { useToast } from '@/components/ui/Toast'
import { COPY } from '@/config/copy'
import { errorMessage } from '@/lib/errors'
import { classLine } from '../utils/classLine'
import { useBookClass } from './useBookingActions'

interface Pending {
  slot: ClassSlotListRow
  waitlist: boolean
}

/**
 * One tap on a class asks "Reservar · Hoy 18:00"; one more books it (or joins the waitlist of a full one).
 * `weeklyLimit`: the plan limits classes per week, so waiting uses one of them and the dialog says so.
 */
export function useBookFlow(today: string, weeklyLimit: boolean) {
  const [pending, setPending] = useState<Pending | null>(null)
  const book = useBookClass()
  const toast = useToast()

  const dialog = {
    visible: pending !== null,
    title: pending?.waitlist ? COPY.book.confirmWaitlistTitle : COPY.book.confirmTitle,
    body: pending
      ? [
          classLine(pending.slot, today),
          ...(pending.waitlist ? [COPY.book.waitlistNote] : []),
          ...(pending.waitlist && weeklyLimit ? [COPY.book.waitlistQuota] : []),
        ]
      : [],
    confirmLabel: pending?.waitlist ? COPY.book.confirmWaitlist : COPY.book.confirm,
    // Not "Cancelar": in this app that means cancelling a class.
    cancelLabel: COPY.book.notNow,
    busy: book.isPending,
    onCancel: () => setPending(null),
    onConfirm: () => {
      if (!pending) return
      book.mutate(pending.slot.id, {
        onSuccess: (result) =>
          toast(result.status === 'booked' ? COPY.book.done : COPY.book.doneWaitlist(result.waitlist_position)),
        onError: (error) => toast(errorMessage(error)),
        onSettled: () => setPending(null),
      })
    },
  }
  return { ask: (slot: ClassSlotListRow, waitlist: boolean) => setPending({ slot, waitlist }), dialog }
}
