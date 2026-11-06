import { useState } from 'react'
import { toGymDate } from '@shared/booking/week.ts'
import type { MyBookingRow } from '@shared/booking/memberRpc.ts'
import { useToast } from '@/components/ui/Toast'
import { COPY } from '@/config/copy'
import { errorMessage } from '@/lib/errors'
import { useNow } from '@/hooks/useNow'
import { formatMinutesSpan } from '@/lib/gymDates'
import { classLine } from '../utils/classLine'
import { cancelKind } from '../utils/myBookings'
import { useCancelBooking } from './useBookingActions'
import { useBookingSettings } from './useBookingData'

/** "Cancelar" asks first, saying whether it will count in the week; then cancels and says how it went. */
export function useCancelFlow() {
  const [booking, setBooking] = useState<MyBookingRow | null>(null)
  const { settings } = useBookingSettings()
  const cancel = useCancelBooking()
  const now = useNow()
  const toast = useToast()

  const kind = booking ? cancelKind(booking, now, settings) : 'free'
  const dialog = {
    visible: booking !== null,
    title: kind === 'leave' ? COPY.cancel.leaveTitle : COPY.cancel.title,
    // First which class it is, so the member can check they tapped the right card.
    body: booking
      ? [
          classLine(booking, toGymDate(now)),
          ...(kind === 'leave' ? [] : [kind === 'late' ? COPY.cancel.late(formatMinutesSpan(settings.cancelUntilMinutes)) : COPY.cancel.free]),
        ]
      : [],
    confirmLabel: kind === 'leave' ? COPY.cancel.confirmLeave : COPY.cancel.confirm,
    cancelLabel: COPY.cancel.keep,
    busy: cancel.isPending,
    onCancel: () => setBooking(null),
    onConfirm: () => {
      if (!booking) return
      cancel.mutate(booking.booking_id, {
        // The database has the last word on whether it counts (the class may have moved meanwhile).
        onSuccess: (result) =>
          toast(result.counts ? COPY.cancel.doneLate : kind === 'leave' ? COPY.cancel.doneLeave : COPY.cancel.done),
        onError: (error) => toast(errorMessage(error)),
        onSettled: () => setBooking(null),
      })
    },
  }
  return { ask: setBooking, dialog }
}
