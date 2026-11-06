// The TV chosen for each Pantalla on this computer (localStorage), shared by dashboards and TV windows.

import { STORAGE_KEYS } from '@/config/app'
import { readStorage, writeStorage } from './safeStorage'
import { serializeTvDisplayMap, type TvDisplayMap } from './tvDisplays'

const listeners = new Set<() => void>()

export const readTvDisplaysRaw = (): string | null => readStorage(STORAGE_KEYS.tvDisplays)

export function saveTvDisplays(map: TvDisplayMap): void {
  writeStorage(STORAGE_KEYS.tvDisplays, serializeTvDisplayMap(map))
  listeners.forEach((listener) => listener())
}

/** Changes from this window and from others (the storage event only fires in the others). */
export function subscribeTvDisplays(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEYS.tvDisplays) listener()
  }
  listeners.add(listener)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** What the automatic Pantallas got in this window (memory only: a new window starts from left to right again). */
let automatic: TvDisplayMap = {}

export const readAutomaticTvDisplays = (): TvDisplayMap => automatic

export function saveAutomaticTvDisplays(next: TvDisplayMap): void {
  automatic = next
}

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
