// Local test mode only: everything in this browser. With the cloud this class is never created.

import { STORAGE_KEYS } from '@/config/app'
import { toDisplayData } from '@/lib/display'
import type { AppData, DisplayData } from '@/types'
import { clearDisplayCache, listenDisplayCache, metaOf, parseEnvelope, readDisplayCache, writeDisplayCache } from './displayCache'
import { normalizeAppData } from './migrate'
import type { ChangeMeta, DisplayChange, RemoteChange, Repository } from './repository'
import { TAB_ID } from './tabId'

function parseSnapshot(raw: string | null): (ChangeMeta & { data: AppData }) | null {
  const envelope = parseEnvelope(raw)
  const data = envelope ? normalizeAppData(envelope.data) : null
  return envelope && data ? { ...metaOf(envelope), data } : null
}

/** Local test mode: the dataset as this browser last saved it (null when there is none or it cannot be read). */
export function readLocalData(): AppData | null {
  try {
    return parseSnapshot(localStorage.getItem(STORAGE_KEYS.data))?.data ?? null
  } catch {
    return null
  }
}

export class LocalStorageRepository implements Repository {
  readonly sharesDataAcrossTabs = true

  async load(): Promise<AppData | null> {
    return readLocalData()
  }

  /** Writes synchronously, so it is also safe inside a pagehide handler. */
  async save(getData: () => AppData, meta: ChangeMeta): Promise<void> {
    const data = getData()
    localStorage.setItem(STORAGE_KEYS.data, JSON.stringify({ ...meta, data }))
    writeDisplayCache(toDisplayData(data), meta)
  }

  /** The first run's demo data already has the library. */
  async seedLibrary(): Promise<null> {
    return null
  }

  async saveDisplay(data: DisplayData, meta: ChangeMeta): Promise<void> {
    writeDisplayCache(data, meta)
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.data)
    clearDisplayCache()
  }

  release(): void {
    // Nothing to stop: the dataset stays in this browser between demo logins.
  }

  /** `storage` events only fire in OTHER tabs, so our own saves never echo back. */
  subscribe(listener: (change: RemoteChange) => void): () => void {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEYS.data) return
      const snapshot = parseSnapshot(event.newValue)
      if (snapshot && snapshot.source !== TAB_ID) listener({ ...snapshot, kind: 'snapshot' })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }

  loadDisplaySync(): DisplayData | null {
    return readDisplayCache()
  }

  subscribeDisplay(listener: (change: DisplayChange) => void): () => void {
    return listenDisplayCache(listener)
  }
}
