// What "Mis clases" and "Reservar" read. Every key starts with one of QUERY_KEYS, so a booking refreshes them all.

import { useQuery } from '@tanstack/react-query'
import { BOOKING_DEFAULTS } from '@shared/booking/constants.ts'
import { gymMonday, type GymDate } from '@shared/booking/week.ts'
import { QUERY_KEYS } from '@/lib/queryClient'
import { backend } from '@/services/backend'

export function useBookingSettings() {
  const query = useQuery({ queryKey: QUERY_KEYS.settings, queryFn: () => backend.bookingSettings() })
  // Until they arrive, the defaults of schema.sql are the best guess (2 h to cancel, 14 days ahead…).
  return { ...query, settings: query.data ?? BOOKING_DEFAULTS }
}

export function useMyBookings() {
  return useQuery({ queryKey: QUERY_KEYS.bookings, queryFn: () => backend.myBookings() })
}

/** "Esta semana 1 de 2" for the week that holds `day` (today when left out). */
export function useWeekUsage(day?: GymDate) {
  const week = day ? gymMonday(day) : 'current'
  return useQuery({ queryKey: [...QUERY_KEYS.usage, week], queryFn: () => backend.myWeekUsage(day) })
}

export function useClassSlots(from: GymDate, to: GymDate) {
  return useQuery({ queryKey: [...QUERY_KEYS.slots, from, to], queryFn: () => backend.classSlots(from, to) })
}
