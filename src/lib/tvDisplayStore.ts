// The screen of each Pantalla on this computer (localStorage), shared by dashboards and TV windows: the one chosen by
// hand, and the one each automatic Pantalla got.

import { STORAGE_KEYS } from '@/config/app'
import { readStorage, writeStorage } from './safeStorage'
import { serializeTvDisplayMap, type TvDisplayMap } from './tvDisplays'

type StoredMapKey = typeof STORAGE_KEYS.tvDisplays | typeof STORAGE_KEYS.tvDisplaysAuto

/** A map kept in localStorage: changes from this window and from others (the storage event only fires in the others). */
function storedMap(key: StoredMapKey) {
  const listeners = new Set<() => void>()
  const read = (): string | null => readStorage(key)
  return {
    read,
    save(map: TvDisplayMap): void {
      const raw = serializeTvDisplayMap(map)
      // Every window writes what it resolved: the same map again must not wake the others up.
      if (raw === read()) return
      writeStorage(key, raw)
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: () => void): () => void {
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) listener()
      }
      listeners.add(listener)
      window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(listener)
        window.removeEventListener('storage', onStorage)
      }
    },
  }
}

const chosen = storedMap(STORAGE_KEYS.tvDisplays)

export const readTvDisplaysRaw = chosen.read
export const saveTvDisplays = chosen.save
export const subscribeTvDisplays = chosen.subscribe

/**
 * What the automatic Pantallas got (rememberTvDisplays). Shared by every window of this browser and kept on this
 * computer: a TV window closed and opened again, or a dashboard reloaded, keeps the same screen instead of starting
 * again from left to right (it could then get none, or another Pantalla's).
 */
const automatic = storedMap(STORAGE_KEYS.tvDisplaysAuto)

export const readAutomaticTvDisplaysRaw = automatic.read
export const saveAutomaticTvDisplays = automatic.save
export const subscribeAutomaticTvDisplays = automatic.subscribe

/** The gym's screen numbers as this window last read them (null until read): only those get a TV (resolveTvDisplays). */
let knownScreens: readonly number[] | null = null
const knownListeners = new Set<() => void>()

export const readKnownScreens = (): readonly number[] | null => knownScreens

export function saveKnownScreens(ids: readonly number[] | null): void {
  const next = ids ? [...new Set(ids)].sort((a, b) => a - b) : null
  if (next?.join(',') === knownScreens?.join(',') && (next === null) === (knownScreens === null)) return
  knownScreens = next
  knownListeners.forEach((listener) => listener())
}

export function subscribeKnownScreens(listener: () => void): () => void {
  knownListeners.add(listener)
  return () => knownListeners.delete(listener)
}
