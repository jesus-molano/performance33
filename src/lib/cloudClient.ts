import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { STORAGE_KEYS } from '@/config/app'
import { BACKEND } from '@/config/backend'
import { withKeepalive } from './keepalive'

const PASSWORD_CHECK_STORAGE_KEY = 'p33:password-check'

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
        global: { fetch: (input, init) => fetch(input, withKeepalive(init)) },
      })
    : null

/** Keeps nothing and shares nothing with the main connection: for checking a password without touching the session. */
export const createPasswordCheckClient = (): SupabaseClient => {
  if (BACKEND.mode !== 'cloud') throw new Error('Only with the cloud')
  return createClient(BACKEND.url, BACKEND.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: PASSWORD_CHECK_STORAGE_KEY },
  })
}
