import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/queryClient'
import { backend } from '@/services/backend'

/** A booking changes the member's classes, their week and the places of every list. */
export function refreshBookingData(queryClient: QueryClient): Promise<unknown> {
  return Promise.all(
    [QUERY_KEYS.bookings, QUERY_KEYS.usage, QUERY_KEYS.slots].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  )
}

export function useBookClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slotId: string) => backend.bookClass(slotId),
    // Also after a refusal: the class may have filled up meanwhile.
    onSettled: () => refreshBookingData(queryClient),
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bookingId: string) => backend.cancelBooking(bookingId),
    onSettled: () => refreshBookingData(queryClient),
  })
}
