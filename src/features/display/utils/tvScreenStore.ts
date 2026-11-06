// The list of named screens of this device (localStorage), shared by dashboards and TV windows.

import { DISPLAY_STORAGE_KEYS } from '@/features/display/config/display'
import { readStorage, removeStorage, writeStorage } from '@/lib/safeStorage'
import { includeTvScreen, parseTvScreens, serializeTvScreens, tvFontScaleName } from './tvScreens'
import { forgetStoredSlots } from './tvSlots'

const listeners = new Set<() => void>()

export const readTvScreensRaw = (): string | null => readStorage(DISPLAY_STORAGE_KEYS.tvScreens)

export function saveTvScreens(screens: readonly number[]): void {
  writeStorage(DISPLAY_STORAGE_KEYS.tvScreens, serializeTvScreens(screens))
  listeners.forEach((listener) => listener())
}

/** Changes from this window and from others (the storage event only fires in the others). */
export function subscribeTvScreens(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === DISPLAY_STORAGE_KEYS.tvScreens) listener()
  }
  listeners.add(listener)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** A window open on a screen always appears in the menu. */
export function ensureTvScreenListed(screen: number): void {
  const screens = parseTvScreens(readTvScreensRaw())
  if (!screens.includes(screen)) saveTvScreens(includeTvScreen(screens, screen))
}

/** A screen added again later starts fresh: its columns and its A-/A+ go with it. */
export function forgetTvScreen(screen: number): void {
  forgetStoredSlots(screen)
  removeStorage(`${DISPLAY_STORAGE_KEYS.fontScale}:${tvFontScaleName(screen)}`)
}
