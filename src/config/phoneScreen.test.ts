import { describe, expect, it } from 'vitest'
import { PHONE_SCREEN_QUERY } from './app'

interface Viewport {
  width: number
  height: number
  pointer: 'fine' | 'coarse'
}

/** Just enough of a media query evaluator for PHONE_SCREEN_QUERY: comma = or, 'and' = and. */
function matches(query: string, viewport: Viewport): boolean {
  return query.split(',').some((part) =>
    part.split(' and ').every((clause) => {
      const [feature, value] = clause.trim().replace(/[()]/g, '').split(':').map((s) => s.trim())
      if (feature === 'max-width') return viewport.width <= parseInt(value, 10)
      if (feature === 'max-height') return viewport.height <= parseInt(value, 10)
      if (feature === 'pointer') return viewport.pointer === value
      throw new Error(`Unknown media feature: ${feature}`)
    }),
  )
}

describe('PHONE_SCREEN_QUERY', () => {
  it('takes phones upright and sideways', () => {
    expect(matches(PHONE_SCREEN_QUERY, { width: 375, height: 812, pointer: 'coarse' })).toBe(true)
    expect(matches(PHONE_SCREEN_QUERY, { width: 844, height: 390, pointer: 'coarse' })).toBe(true)
  })

  it('takes a narrow window', () => {
    expect(matches(PHONE_SCREEN_QUERY, { width: 700, height: 900, pointer: 'fine' })).toBe(true)
  })

  it('keeps a laptop with a low viewport a laptop', () => {
    expect(matches(PHONE_SCREEN_QUERY, { width: 1100, height: 480, pointer: 'fine' })).toBe(false)
    expect(matches(PHONE_SCREEN_QUERY, { width: 1366, height: 800, pointer: 'fine' })).toBe(false)
  })
})
