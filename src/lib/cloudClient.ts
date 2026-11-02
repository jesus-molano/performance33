import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { STORAGE_KEYS } from '@/config/app'
import { BACKEND } from '@/config/backend'

/**
 * The one cloud connection, or null in local test mode. PKCE keeps login tokens out of the address
 * hash, which the app's routes use. The session lives in localStorage, so TV popups share it.
 */
export const cloudClient: SupabaseClient | null =
  BACKEND.mode === 'cloud'
    ? createClient(BACKEND.url, BACKEND.anonKey, {
        auth: {
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: STORAGE_KEYS.cloudSession,
        },
      })
    : null
