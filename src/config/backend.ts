// Where the app keeps its data. The mode comes ONLY from the build's env vars: when they are set,
// the local demo login does not exist at all (see auth/instance.ts).

export type BackendConfig =
  | { mode: 'cloud'; url: string; anonKey: string }
  | { mode: 'local' }
  /** Only one of the two variables is set: refuse to start rather than fall back to the demo login. */
  | { mode: 'invalid' }

interface BackendEnv {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
}

export function readBackendConfig(env: BackendEnv): BackendConfig {
  const url = env.VITE_SUPABASE_URL?.trim()
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim()
  if (url && anonKey) return { mode: 'cloud', url, anonKey }
  return url || anonKey ? { mode: 'invalid' } : { mode: 'local' }
}

export const BACKEND: BackendConfig = readBackendConfig(import.meta.env)
