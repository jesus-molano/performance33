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
