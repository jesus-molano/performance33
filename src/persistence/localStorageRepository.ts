import { STORAGE_KEYS } from '@/config/app'
import { toDisplayData } from '@/lib/display'
import type { AppData, DisplayData } from '@/types'
import { normalizeAppData } from './migrate'
import type { ChangeMeta, DisplayChange, RemoteChange, Repository } from './repository'
import { TAB_ID } from './tabId'

/** What is stored under each key. */
interface StoredEnvelope<T> extends ChangeMeta {
  data: T
}

function parseRaw(raw: string | null): Partial<StoredEnvelope<unknown>> | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as Partial<StoredEnvelope<unknown>>) : null
  } catch {
    return null
  }
}

const metaOf = (envelope: Partial<ChangeMeta>): ChangeMeta => ({
  source: String(envelope.source ?? ''),
  revision: Number(envelope.revision) || 0,
})

function parseEnvelope(raw: string | null): StoredEnvelope<AppData> | null {
  const envelope = parseRaw(raw)
  const data = envelope ? normalizeAppData(envelope.data) : null
  return envelope && data ? { ...metaOf(envelope), data } : null
}

/** Display copy, normalised and re-sanitised on read (even a tampered key cannot carry private fields). */
function normalizeDisplayData(raw: unknown): DisplayData | null {
  if (typeof raw !== 'object' || raw === null) return null
  const data = normalizeAppData({ coaches: [{ id: 'display' }], notes: [], customExercises: [], ...raw })
  return data ? toDisplayData(data) : null
}

function parseDisplayEnvelope(raw: string | null): StoredEnvelope<DisplayData> | null {
  const envelope = parseRaw(raw)
  const data = envelope ? normalizeDisplayData(envelope.data) : null
  return envelope && data ? { ...metaOf(envelope), data } : null
}

function write(key: string, envelope: StoredEnvelope<unknown>): void {
  localStorage.setItem(key, JSON.stringify(envelope))
}

export class LocalStorageRepository implements Repository {
  private readonly key: string
  private readonly displayKey: string

  constructor(key: string = STORAGE_KEYS.data, displayKey: string = STORAGE_KEYS.display) {
    this.key = key
    this.displayKey = displayKey
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
    write(this.key, { ...meta, data })
    write(this.displayKey, { ...meta, data: toDisplayData(data) })
  }

  async saveDisplay(data: DisplayData, meta: ChangeMeta): Promise<void> {
    write(this.displayKey, { ...meta, data })
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key)
    localStorage.removeItem(this.displayKey)
  }

  /** `storage` events only fire in OTHER tabs, so our own saves never echo back. */
  subscribe(listener: (change: RemoteChange) => void): () => void {
    return this.listen(this.key, parseEnvelope, listener)
  }

  loadDisplaySync(): DisplayData | null {
    try {
      return parseDisplayEnvelope(localStorage.getItem(this.displayKey))?.data ?? null
    } catch {
      return null
    }
  }

  subscribeDisplay(listener: (change: DisplayChange) => void): () => void {
    return this.listen(this.displayKey, parseDisplayEnvelope, listener)
  }

  private listen<T>(
    key: string,
    parse: (raw: string | null) => StoredEnvelope<T> | null,
    listener: (change: StoredEnvelope<T>) => void,
  ): () => void {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return
      const envelope = parse(event.newValue)
      if (envelope && envelope.source !== TAB_ID) listener(envelope)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }
}
