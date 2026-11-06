// react-query: data is asked again when the app comes back to the front (phones: AppState; the web does it itself).

import { focusManager, QueryClient } from '@tanstack/react-query'
import { AppState, Platform } from 'react-native'
import { QUERY_STALE_MS } from '@/config/app'

export const QUERY_KEYS = {
  member: ['member'],
  settings: ['settings'],
  bookings: ['bookings'],
  usage: ['usage'],
  slots: ['slots'],
  routine: ['routine'],
} as const

export function createQueryClient(): QueryClient {
  if (Platform.OS !== 'web') {
    focusManager.setEventListener((setFocused) => {
      const subscription = AppState.addEventListener('change', (state) => setFocused(state === 'active'))
      return () => subscription.remove()
    })
  }
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: QUERY_STALE_MS, retry: 1, refetchOnWindowFocus: true },
      mutations: { retry: 0 },
    },
  })
}
