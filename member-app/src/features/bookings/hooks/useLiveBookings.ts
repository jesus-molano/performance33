import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { backend } from '@/services/backend'
import { refreshBookingData } from './useBookingActions'

/** While the app is open, a change to the member's own bookings (a coach, the waitlist) shows up at once. */
export function useLiveBookings(clientId: string | null | undefined) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!clientId) return
    return backend.watchMyBookings(clientId, () => void refreshBookingData(queryClient))
  }, [clientId, queryClient])
}
