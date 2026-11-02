// Named TV screens (Pantalla 1, Pantalla 2…): one window, one TV, its own columns. Pure rules plus the names derived from a number.

import { TV_DEFAULT_SCREEN, TV_MAX_SCREENS } from '@/config/app'
import { DISPLAY_STORAGE_KEYS } from '@/features/display/config/display'

const isValidScreen = (screen: number) => Number.isInteger(screen) && screen >= 1 && screen <= TV_MAX_SCREENS

export const tvScreenTitle = (screen: number): string => `Pantalla ${screen}`

/** Pantalla 1 keeps the key of older versions, so a setup saved before named screens is still there. */
export const tvSlotsKey = (screen: number): string =>
  screen === TV_DEFAULT_SCREEN ? DISPLAY_STORAGE_KEYS.tvSlots : `${DISPLAY_STORAGE_KEYS.tvSlots}:${screen}`

/** Name for the remembered A-/A+ size (Pantalla 1 keeps the older one). */
export const tvFontScaleName = (screen: number): string => (screen === TV_DEFAULT_SCREEN ? 'tv' : `tv:${screen}`)

/** '1,2' → [1, 2], sorted and without repeats. Nothing valid (first use, damaged value) → only Pantalla 1. */
export function parseTvScreens(raw: string | null): number[] {
  const screens = (raw ?? '').split(',').filter(Boolean).map(Number).filter(isValidScreen)
  return screens.length ? [...new Set(screens)].sort((a, b) => a - b) : [TV_DEFAULT_SCREEN]
}

export const serializeTvScreens = (screens: readonly number[]): string => screens.join(',')

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

/** Adds a number if it is not there (a bookmarked window of a screen this device does not list). */
export function includeTvScreen(screens: readonly number[], screen: number): number[] {
  return screens.includes(screen) ? [...screens] : [...screens, screen].sort((a, b) => a - b)
}

export function removeTvScreen(screens: readonly number[], screen: number): number[] {
  return canRemoveTvScreen(screens) ? screens.filter((s) => s !== screen) : [...screens]
}
