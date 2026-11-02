// Where the app keeps its data. The mode comes ONLY from the build's env vars: when they are set,
// the local demo login does not exist at all (see auth/instance.ts). A published site never gets
// that passwordless login by accident: it has to be asked for with VITE_ALLOW_LOCAL_DEMO.

export type BackendConfig =
  | { mode: 'cloud'; url: string; anonKey: string }
  | { mode: 'local' }
  /** Half a configuration, or a published site with none: refuse to start rather than fall back to the demo login. */
  | { mode: 'invalid' }

interface BackendEnv {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
  VITE_ALLOW_LOCAL_DEMO?: string
  /** Set by Vite in a production build. */
  PROD?: boolean
}

export function readBackendConfig(env: BackendEnv): BackendConfig {
  const url = env.VITE_SUPABASE_URL?.trim()
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim()
  if (url && anonKey) return { mode: 'cloud', url, anonKey }
  if (url || anonKey) return { mode: 'invalid' }
  return env.PROD && env.VITE_ALLOW_LOCAL_DEMO !== 'true' ? { mode: 'invalid' } : { mode: 'local' }
}

export const BACKEND: BackendConfig = readBackendConfig(import.meta.env)
