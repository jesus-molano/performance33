import { describe, expect, it } from 'vitest'
import { readBackendConfig } from './backend'

describe('readBackendConfig', () => {
  it('uses the cloud whenever both variables are set', () => {
    expect(readBackendConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'k' })).toEqual({
      mode: 'cloud',
      url: 'https://x.supabase.co',
      anonKey: 'k',
    })
  })

  it('is local only when both are missing or empty', () => {
    expect(readBackendConfig({})).toEqual({ mode: 'local' })
    expect(readBackendConfig({ VITE_SUPABASE_URL: ' ', VITE_SUPABASE_ANON_KEY: '' })).toEqual({ mode: 'local' })
  })

  it('a published site is local only when asked for', () => {
    expect(readBackendConfig({ PROD: true })).toEqual({ mode: 'invalid' })
    expect(readBackendConfig({ PROD: true, VITE_ALLOW_LOCAL_DEMO: 'false' })).toEqual({ mode: 'invalid' })
    expect(readBackendConfig({ PROD: true, VITE_ALLOW_LOCAL_DEMO: 'true' })).toEqual({ mode: 'local' })
  })

  it('the cloud wins over the demo flag, and half a configuration stays refused', () => {
    expect(readBackendConfig({ VITE_SUPABASE_URL: 'u', VITE_SUPABASE_ANON_KEY: 'k', VITE_ALLOW_LOCAL_DEMO: 'true' })).toMatchObject({ mode: 'cloud' })
    expect(readBackendConfig({ VITE_SUPABASE_URL: 'u', VITE_ALLOW_LOCAL_DEMO: 'true' })).toEqual({ mode: 'invalid' })
  })

  it('never falls back to local with half a configuration', () => {
    expect(readBackendConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toEqual({ mode: 'invalid' })
    expect(readBackendConfig({ VITE_SUPABASE_ANON_KEY: 'k' })).toEqual({ mode: 'invalid' })
  })
})
