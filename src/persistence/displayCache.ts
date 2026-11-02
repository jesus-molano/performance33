// The sanitised copy for Pantalla / TV windows, kept on this device while someone is signed in.

import { STORAGE_KEYS } from '@/config/app'
import { toCompactDisplayData, toDisplayData } from '@/lib/display'
import { removeStorage } from '@/lib/safeStorage'
import type { DisplayData } from '@/types'
import { normalizeAppData } from './migrate'
import type { ChangeMeta, DisplayChange } from './repository'
import { TAB_ID } from './tabId'

export interface StoredEnvelope<T> extends ChangeMeta {
  data: T
}

export function parseEnvelope(raw: string | null): Partial<StoredEnvelope<unknown>> | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as Partial<StoredEnvelope<unknown>>) : null
  } catch {
    return null
  }
}

export const metaOf = (envelope: Partial<ChangeMeta>): ChangeMeta => ({
  source: String(envelope.source ?? ''),
  revision: Number(envelope.revision) || 0,
})

/** Normalised and re-sanitised on read (even a tampered key cannot carry private fields). */
function normalizeDisplayData(raw: unknown): DisplayData | null {
  if (typeof raw !== 'object' || raw === null) return null
  const data = normalizeAppData({ notes: [], customExercises: [], ...raw })
  return data ? toDisplayData(data) : null
}

function parseDisplayEnvelope(raw: string | null): StoredEnvelope<DisplayData> | null {
  const envelope = parseEnvelope(raw)
  const data = envelope ? normalizeDisplayData(envelope.data) : null
  return envelope && data ? { ...metaOf(envelope), data } : null
}

function tryWriteDisplayCache(data: DisplayData, meta: ChangeMeta): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.display, JSON.stringify({ ...meta, data }))
    return true
  } catch {
    return false
  }
}

/**
 * Never throws: this copy must never get in the way of saving the shared data. Open TV windows keep
 * updating over the live channel even when it fails (storage full or blocked).
 */
export function writeDisplayCache(data: DisplayData, meta: ChangeMeta): void {
  if (!tryWriteDisplayCache(data, meta)) tryWriteDisplayCache(toCompactDisplayData(data), meta)
}

export function readDisplayCache(): DisplayData | null {
  try {
    return parseDisplayEnvelope(localStorage.getItem(STORAGE_KEYS.display))?.data ?? null
  } catch {
    return null
  }
}

export function clearDisplayCache(): void {
  removeStorage(STORAGE_KEYS.display)
}

/** `storage` events only fire in OTHER tabs, so our own saves never echo back. */
export function listenDisplayCache(listener: (change: DisplayChange) => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEYS.display) return
    const envelope = parseDisplayEnvelope(event.newValue)
    if (envelope && envelope.source !== TAB_ID) listener(envelope)
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
