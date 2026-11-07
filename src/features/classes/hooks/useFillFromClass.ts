// "Rellenar con la clase de 18:00" (Pantallas menu and phone remote) and "Mandar a pantallas" (each class): the people
// with a place go to the free sections, each on the day that is next for them. Both wait until those days are known:
// sending before would put everyone on Día 1 and record it as today's session.

import { useCallback, useMemo } from 'react'
import { canFillFrom, pickFillSlot, toGymDate } from '@shared/booking'
import { useClients } from '@/store'
import { FILL_COPY, useFillScreens } from '@/features/screens'
import { useNextDayLookup, useSessionsReadiness, type SessionsReadiness } from '@/features/sessions'
import type { Booking, SlotSummary } from '@/features/classes/types'
import { classFillOf } from '@/features/classes/utils/fill'
import { formatGymTime } from '@/features/classes/utils/time'
import { useClassDay, useClassesClock } from './useClassesData'

export interface FillFromClass {
  label: string
  /** Why it cannot be used now ('No quedan clases hoy'), or null. */
  hint: string | null
  disabled: boolean
  run: () => void
}

/** Why the next days cannot be used yet, or null once they are known. */
const daysHint = (readiness: SessionsReadiness): string | null =>
  readiness === 'known' ? null : readiness === 'failed' ? FILL_COPY.daysFailed : FILL_COPY.daysLoading

/** Sends the people with a place in that class to the screens. */
function useSendBookings(): { send: (bookings: readonly Booking[], slotId: string) => void; blocked: string | null } {
  const fill = useFillScreens()
  const clients = useClients({ includeArchived: true })
  const byId = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients])
  const nextDay = useNextDayLookup()
  const blocked = daysHint(useSessionsReadiness())
  const send = useCallback(
    (bookings: readonly Booking[], slotId: string) => {
      const { people, hidden } = classFillOf(bookings, slotId, byId, nextDay)
      fill(people, hidden)
    },
    [byId, fill, nextDay],
  )
  return { send, blocked }
}

const NOTHING = () => undefined

/** The class under way (from 10 minutes before) or the next one today. */
export function useFillFromClass(): FillFromClass {
  const now = useClassesClock()
  const { status, data } = useClassDay(toGymDate(now))
  const { send, blocked } = useSendBookings()
  const slot = data ? pickFillSlot(data.slots, now) : null
  if (!slot || !data) {
    const hint = status === 'ready' ? FILL_COPY.noClassHint : status === 'error' ? FILL_COPY.classesFailed : null
    return { label: FILL_COPY.noClass, hint, disabled: true, run: NOTHING }
  }
  const label = FILL_COPY.fillWith(formatGymTime(slot.startsAt))
  if (blocked) return { label, hint: blocked, disabled: true, run: NOTHING }
  return { label, hint: null, disabled: false, run: () => send(data.bookings, slot.id) }
}

export interface SendClassToScreens {
  /** Only a class of today not over yet (the people are in the gym): never a class of another day. */
  shown: boolean
  /** Why it cannot be used yet ('Cargando…'), or null. */
  hint: string | null
  run: () => void
}

/** 'Mandar a pantallas' on one class. */
export function useSendClassToScreens(slot: SlotSummary, bookings: readonly Booking[], now: number): SendClassToScreens {
  const { send, blocked } = useSendBookings()
  const run = useCallback(() => send(bookings, slot.id), [bookings, send, slot.id])
  return { shown: canFillFrom(slot, now), hint: blocked, run }
}
