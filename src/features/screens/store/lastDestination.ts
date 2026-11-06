// The last section this device sent someone to (a per-device convenience: Ctrl+clic and long press).

import { readStorage, writeStorage } from '@/lib/safeStorage'
import { SCREENS_LAST_SEND_KEY } from '@/features/screens/config/screens'
import type { SectionRef } from '@/features/screens/types'
import { sectionId } from '@/features/screens/utils/sections'

const listeners = new Set<() => void>()

export const readLastDestination = (): string | null => readStorage(SCREENS_LAST_SEND_KEY)

export function saveLastDestination(ref: SectionRef): void {
  writeStorage(SCREENS_LAST_SEND_KEY, sectionId(ref))
  listeners.forEach((listener) => listener())
}

/** Every 'Pantalla' button of this window and of the others (the storage event only fires in the others). */
export function subscribeLastDestination(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SCREENS_LAST_SEND_KEY) listener()
  }
  listeners.add(listener)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}
