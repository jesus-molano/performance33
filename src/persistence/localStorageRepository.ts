import { STORAGE_KEYS } from '../config/app'
import type { AppData } from '../types'
import { normalizeAppData } from './migrate'
import type { ChangeMeta, RemoteChange, Repository } from './repository'
import { TAB_ID } from './tabId'

/** What is stored under the data key. */
interface StoredEnvelope extends ChangeMeta {
  data: AppData
}

function parseEnvelope(raw: string | null): StoredEnvelope | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const envelope = parsed as Partial<StoredEnvelope>
    const data = normalizeAppData(envelope.data)
    if (!data) return null
    return { data, source: String(envelope.source ?? ''), revision: Number(envelope.revision) || 0 }
  } catch {
    return null
  }
}

export class LocalStorageRepository implements Repository {
  private readonly key: string

  constructor(key: string = STORAGE_KEYS.data) {
    this.key = key
  }

  loadSync(): AppData | null {
    try {
      return parseEnvelope(localStorage.getItem(this.key))?.data ?? null
    } catch {
      return null
    }
  }

  async load(): Promise<AppData | null> {
    return this.loadSync()
  }

  /** Writes synchronously, so it is also safe inside a pagehide handler. */
  async save(data: AppData, meta: ChangeMeta): Promise<void> {
    const envelope: StoredEnvelope = { ...meta, data }
    localStorage.setItem(this.key, JSON.stringify(envelope))
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key)
  }

  /** `storage` events only fire in OTHER tabs, so our own saves never echo back. */
  subscribe(listener: (change: RemoteChange) => void): () => void {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== this.key) return
      const envelope = parseEnvelope(event.newValue)
      if (envelope && envelope.source !== TAB_ID) listener(envelope)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }
}
