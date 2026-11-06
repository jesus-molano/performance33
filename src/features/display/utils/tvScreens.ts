// Named TV screens (Pantalla 1, Pantalla 2…): one window, one TV, its own columns. Pure rules plus the names derived from a number.

import { TV_DEFAULT_SCREEN, TV_MAX_SCREENS } from '@/config/app'
import { DISPLAY_STORAGE_KEYS } from '@/features/display/config/display'
import type { ScreensStatus } from '@/features/screens/types'
import { defaultScreenName } from '@/features/screens/utils/sections'

/** Name of a screen the gym has not renamed. */
export const tvScreenTitle = defaultScreenName

/** Pantalla 1 keeps the key of older versions, so a setup saved before named screens is still there. */
export const tvSlotsKey = (screen: number): string =>
  screen === TV_DEFAULT_SCREEN ? DISPLAY_STORAGE_KEYS.tvSlots : `${DISPLAY_STORAGE_KEYS.tvSlots}:${screen}`

/** Name for the remembered A-/A+ size (Pantalla 1 keeps the older one). */
export const tvFontScaleName = (screen: number): string => (screen === TV_DEFAULT_SCREEN ? 'tv' : `tv:${screen}`)

export const canAddTvScreen = (screens: readonly number[]): boolean => screens.length < TV_MAX_SCREENS
/** At least one screen always stays. */
export const canRemoveTvScreen = (screens: readonly number[]): boolean => screens.length > 1

/** Lowest free number (a removed Pantalla 2 comes back as Pantalla 2), or null at the maximum. */
export function nextTvScreen(screens: readonly number[]): number | null {
  if (!canAddTvScreen(screens)) return null
  let next = TV_DEFAULT_SCREEN
  while (screens.includes(next)) next++
  return next
}

/** What a TV window shows instead of its sections, or null to show them. */
export type TvWindowState = 'loading' | 'retrying' | 'removed'

export function tvWindowState(status: ScreensStatus, loadFailed: boolean, exists: boolean): TvWindowState | null {
  if (status === 'idle') return loadFailed ? 'retrying' : 'loading'
  return exists ? null : 'removed'
}
