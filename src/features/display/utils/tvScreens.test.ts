import { describe, expect, it } from 'vitest'
import { TV_MAX_SCREENS } from '@/config/app'
import { DISPLAY_STORAGE_KEYS } from '@/features/display/config/display'
import {
  canAddTvScreen,
  canRemoveTvScreen,
  nextTvScreen,
  tvFontScaleName,
  tvScreenTitle,
  tvSlotsKey,
  tvWindowState,
} from './tvScreens'

describe('named TV screens', () => {
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

  it('never removes the last screen', () => {
    expect(canRemoveTvScreen([1, 2])).toBe(true)
    expect(canRemoveTvScreen([1])).toBe(false)
  })
})

describe('tvWindowState', () => {
  it('says loading, then retrying, until the screens are read; then the sections, or that it was removed', () => {
    expect(tvWindowState('idle', false, true)).toBe('loading')
    expect(tvWindowState('idle', true, true)).toBe('retrying')
    expect(tvWindowState('cached', false, true)).toBeNull()
    expect(tvWindowState('ready', false, true)).toBeNull()
    expect(tvWindowState('ready', false, false)).toBe('removed')
  })
})
