import { describe, expect, it } from 'vitest'
import { TV_MAX_SCREENS } from '@/config/app'
import { DISPLAY_STORAGE_KEYS } from '@/features/display/config/display'
import {
  canAddTvScreen,
  canRemoveTvScreen,
  includeTvScreen,
  nextTvScreen,
  parseTvScreens,
  removeTvScreen,
  serializeTvScreens,
  tvFontScaleName,
  tvScreenTitle,
  tvSlotsKey,
} from './tvScreens'

describe('named TV screens', () => {
  it('starts with Pantalla 1 and survives damaged values', () => {
    expect(parseTvScreens(null)).toEqual([1])
    expect(parseTvScreens('')).toEqual([1])
    expect(parseTvScreens('hola,0,-2,1.5,999')).toEqual([1])
  })

  it('round-trips the list, sorted and without repeats', () => {
    expect(parseTvScreens('3,1,3')).toEqual([1, 3])
    expect(parseTvScreens(serializeTvScreens([1, 4]))).toEqual([1, 4])
  })

  it('gives each screen its own title and keys, keeping the old ones for Pantalla 1', () => {
    expect(tvScreenTitle(2)).toBe('Pantalla 2')
    expect(tvSlotsKey(1)).toBe(DISPLAY_STORAGE_KEYS.tvSlots)
    expect(tvSlotsKey(2)).not.toBe(tvSlotsKey(1))
    expect(tvSlotsKey(2)).not.toBe(tvSlotsKey(3))
    expect(tvFontScaleName(1)).toBe('tv')
    expect(tvFontScaleName(2)).not.toBe(tvFontScaleName(3))
  })

  it('adds the lowest free number up to the maximum', () => {
    expect(nextTvScreen([1])).toBe(2)
    expect(nextTvScreen([1, 3])).toBe(2)
    expect(nextTvScreen([2])).toBe(1)
    const full = Array.from({ length: TV_MAX_SCREENS }, (_, i) => i + 1)
    expect(canAddTvScreen(full)).toBe(false)
    expect(nextTvScreen(full)).toBeNull()
  })

  it('removes a screen but never the last one', () => {
    expect(removeTvScreen([1, 2, 3], 2)).toEqual([1, 3])
    expect(canRemoveTvScreen([1])).toBe(false)
    expect(removeTvScreen([2], 2)).toEqual([2])
  })

  it('lists a screen opened from a bookmark once', () => {
    expect(includeTvScreen([1], 3)).toEqual([1, 3])
    expect(includeTvScreen([1, 3], 3)).toEqual([1, 3])
  })
})
