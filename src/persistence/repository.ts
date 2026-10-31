// Persistence boundary. The app only talks to a Repository, so the localStorage
// implementation can later be swapped for Supabase without touching store or UI.
// Display windows (TV) only use the *Display methods: they never read private data
// (a backend would expose those through a public view).

import type { AppData, DisplayData } from '@/types'

/** Identifies one change: who made it and its sequence number at that source. */
export interface ChangeMeta {
  /** Id of the tab/device that produced the change. */
  source: string
  /** Monotonic counter per source; receivers drop anything not newer than what they applied. */
  revision: number
}

export interface RemoteChange extends ChangeMeta {
  data: AppData
}

export interface DisplayChange extends ChangeMeta {
  data: DisplayData
}

export interface Repository {
  /** Load the whole dataset, or null if nothing is stored yet. */
  load(): Promise<AppData | null>
  /** Synchronous load when the backend allows it (localStorage), to render without a spinner. */
  loadSync(): AppData | null
  /** Persist the whole dataset and its sanitised display copy. Rejects on failure (e.g. storage quota). */
  save(data: AppData, meta: ChangeMeta): Promise<void>
  /** Persist only the sanitised display copy (e.g. on start-up, for data saved by older versions). */
  saveDisplay(data: DisplayData, meta: ChangeMeta): Promise<void>
  /** Remove everything stored. */
  clear(): Promise<void>
  /** Changes made elsewhere (other tabs/devices). Never fires for this tab's own saves. */
  subscribe(listener: (change: RemoteChange) => void): () => void
  /** Sanitised data for display windows, or null if nothing is stored yet. */
  loadDisplaySync(): DisplayData | null
  /** Sanitised changes for display windows. */
  subscribeDisplay(listener: (change: DisplayChange) => void): () => void
}
