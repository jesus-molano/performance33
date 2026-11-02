// Deno only: what both functions read from the environment. Never imported by the web app or vitest.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { parseAllowedOrigins } from '../_shared/http.ts'

const required = (name: string): string => {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

const AUTH_OPTIONS = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }

export const allowedOrigins = (): string[] => parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'))

/** Bypasses the access rules: used only after checking who is calling. */
export const serviceClient = (): SupabaseClient => createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), AUTH_OPTIONS)

/** Public key, optionally acting as the caller. */
export const publicClient = (token?: string): SupabaseClient =>
  createClient(required('SUPABASE_URL'), required('SUPABASE_ANON_KEY'), {
    ...AUTH_OPTIONS,
    ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
  })
