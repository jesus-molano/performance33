import { describe, expect, it } from 'vitest'
import { KEEPALIVE_MAX_BODY_CHARS } from '@/config/app'
import { withKeepalive } from './keepalive'

describe('withKeepalive', () => {
  it('marks small writes', () => {
    expect(withKeepalive({ method: 'POST', body: '{}' })).toEqual({ method: 'POST', body: '{}', keepalive: true })
  })

  it('leaves big writes and reads alone', () => {
    const big = { method: 'POST', body: 'x'.repeat(KEEPALIVE_MAX_BODY_CHARS + 1) }
    expect(withKeepalive(big)).toBe(big)
    expect(withKeepalive({ method: 'GET' })).toEqual({ method: 'GET' })
    expect(withKeepalive(undefined)).toBeUndefined()
  })
})
