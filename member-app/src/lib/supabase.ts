// The Supabase client of the app (only when EXPO_PUBLIC_SUPABASE_URL and _ANON_KEY are set).
// The session is saved with authStorage: SecureStore on phones, localStorage on the web.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'
import { STORAGE_KEYS, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/config/app'
import { authStorage } from './authStorage'

export function createSupabaseClient(): SupabaseClient {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: authStorage,
      storageKey: STORAGE_KEYS.session,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
  // Phones: refresh the token only while the app is in front (the web does it on its own).
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') void client.auth.startAutoRefresh()
      else void client.auth.stopAutoRefresh()
    })
  }
  return client
}
