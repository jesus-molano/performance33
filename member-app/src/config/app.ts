// Connection, addresses, timings and storage keys. Only public values: the anon key is meant to be in the app.

/** Supabase of the gym. Without both the app runs as the offline demo. */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const HAS_BACKEND = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== ''

/** Where this app is published (privacy page, account deletion page). */
export const APP_URL = (process.env.EXPO_PUBLIC_APP_URL ?? 'https://performance33-socios.vercel.app').replace(/\/+$/, '')
export const PRIVACY_PATH = '/privacidad'

export const EDGE_FUNCTIONS = {
  loginUsername: 'login-username',
  memberAccounts: 'member-accounts',
} as const

/** Session of the login in the device: SecureStore on phones, localStorage on the web. */
export const STORAGE_KEYS = {
  session: 'p33-socios-session',
} as const

/** SecureStore warns above 2048 bytes per value: a longer session is stored in pieces of this size. */
export const SECURE_STORE_CHUNK_SIZE = 1800

/** Data is considered fresh this long; coming back to the app always asks again. */
export const QUERY_STALE_MS = 30_000
/** A booking toast stays this long. */
export const TOAST_MS = 3500
/** The realtime channel of the member's own bookings. */
export const BOOKINGS_CHANNEL = 'my-bookings'
