import { describe, expect, it } from 'vitest'
import { TV_MAX_SCREENS } from '@/config/app'
import { canRemoveWithTvs, createsScreensHere, followsDetectedTvs, planMissingScreens, unplacedTvCount } from './autoScreens'

describe('unplacedTvCount', () => {
  it('counts the TVs no screen got', () => {
    expect(unplacedTvCount(['A', 'B'], ['A', 'B'])).toBe(0)
    expect(unplacedTvCount(['A', 'B', 'C'], ['B'])).toBe(2)
    expect(unplacedTvCount([], ['A'])).toBe(0)
  })

  it('a screen sent to the laptop by hand does not hide a TV without screen', () => {
    expect(unplacedTvCount(['A', 'B'], ['Laptop', 'A'])).toBe(1)
  })
})

describe('planMissingScreens', () => {
  it('creates nothing when every TV already has a screen', () => {
    expect(planMissingScreens([1, 2], 0)).toEqual([])
    expect(planMissingScreens([1], 0)).toEqual([])
  })

  it('adds the lowest free numbers, one per TV without screen', () => {
    expect(planMissingScreens([1, 2], 2)).toEqual([3, 4])
    expect(planMissingScreens([2], 2)).toEqual([1, 3])
    expect(planMissingScreens([], 1)).toEqual([1])
  })

  it('a removed screen does not count: screens 2 and 3 with 2 TVs placed create nothing, 3 TVs with one placed create 2', () => {
    expect(planMissingScreens([2, 3], 0)).toEqual([])
    expect(planMissingScreens([2, 3], 1)).toEqual([1])
  })

  it('creates first the numbers chosen by hand for a TV on this laptop', () => {
    expect(planMissingScreens([1], 1, [1, 5])).toEqual([5])
    expect(planMissingScreens([1], 2, [4])).toEqual([4, 2])
  })

  it('never goes past the maximum, nor plans a number twice or out of range', () => {
    const all = Array.from({ length: TV_MAX_SCREENS - 1 }, (_, i) => i + 1)
    expect(planMissingScreens(all, 20)).toEqual([TV_MAX_SCREENS])
    expect(planMissingScreens([], 2, [3, 3, 0, 99])).toEqual([3, 1])
  })

  it('gives the same plan for the same inputs (two tabs at once create the same screens)', () => {
    expect(planMissingScreens([1, 3], 2, [2])).toEqual(planMissingScreens([3, 1], 2, [2]))
  })
})

describe('followsDetectedTvs', () => {
  it('only when the browser reads the screens', () => {
    expect(followsDetectedTvs('ok')).toBe(true)
    for (const state of ['unsupported', 'needs-permission', 'denied', 'single'] as const) expect(followsDetectedTvs(state)).toBe(false)
  })
})

describe('createsScreensHere', () => {
  it('only on the TV laptop: TVs seen and a TV window open in this browser', () => {
    expect(createsScreensHere(true, 1)).toBe(true)
    expect(createsScreensHere(true, 0)).toBe(false)
    expect(createsScreensHere(false, 2)).toBe(false)
  })
})

describe('canRemoveWithTvs', () => {
  it('keeps the screens that have a TV while the TVs are seen', () => {
    expect(canRemoveWithTvs(true, true)).toBe(false)
    expect(canRemoveWithTvs(false, true)).toBe(true)
    expect(canRemoveWithTvs(true, false)).toBe(true)
  })
})
