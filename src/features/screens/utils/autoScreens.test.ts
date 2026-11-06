import { describe, expect, it } from 'vitest'
import { TV_MAX_SCREENS } from '@/config/app'
import { canRemoveWithTvs, followsDetectedTvs, planMissingScreens } from './autoScreens'

describe('planMissingScreens', () => {
  it('creates nothing when every TV already has a screen, or there are more screens', () => {
    expect(planMissingScreens([1, 2], 2)).toEqual([])
    expect(planMissingScreens([1, 2, 3], 1)).toEqual([])
    expect(planMissingScreens([1], 0)).toEqual([])
  })

  it('adds the lowest free numbers for the TVs beyond the screens', () => {
    expect(planMissingScreens([1, 2], 4)).toEqual([3, 4])
    expect(planMissingScreens([2], 3)).toEqual([1, 3])
    expect(planMissingScreens([], 1)).toEqual([1])
  })

  it('creates first the screens a TV is already given to on this laptop', () => {
    expect(planMissingScreens([1], 2, [1, 5])).toEqual([5])
    expect(planMissingScreens([1], 3, [4])).toEqual([4, 2])
  })

  it('never goes past the maximum, nor plans a number twice or out of range', () => {
    const all = Array.from({ length: TV_MAX_SCREENS - 1 }, (_, i) => i + 1)
    expect(planMissingScreens(all, 20)).toEqual([TV_MAX_SCREENS])
    expect(planMissingScreens([], 2, [3, 3, 0, 99])).toEqual([3, 1])
  })

  it('gives the same plan for the same inputs (two tabs at once create the same screens)', () => {
    expect(planMissingScreens([1, 3], 4, [2])).toEqual(planMissingScreens([3, 1], 4, [2]))
  })
})

describe('followsDetectedTvs', () => {
  it('only when the browser reads the screens', () => {
    expect(followsDetectedTvs('ok')).toBe(true)
    for (const state of ['unsupported', 'needs-permission', 'denied', 'single'] as const) expect(followsDetectedTvs(state)).toBe(false)
  })
})

describe('canRemoveWithTvs', () => {
  it('keeps one screen per connected TV while the TVs are seen', () => {
    expect(canRemoveWithTvs(2, 2, true)).toBe(false)
    expect(canRemoveWithTvs(3, 2, true)).toBe(true)
    expect(canRemoveWithTvs(2, 2, false)).toBe(true)
  })
})
