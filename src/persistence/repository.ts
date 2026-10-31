// Persistence boundary. The app only talks to a Repository, so the localStorage
// implementation can later be swapped for Supabase without touching store or UI.

import type { AppData } from '../types'

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

export interface Repository {
  /** Load the whole dataset, or null if nothing is stored yet. */
  load(): Promise<AppData | null>
  /** Synchronous load when the backend allows it (localStorage), to render without a spinner. */
  loadSync(): AppData | null
  /** Persist the whole dataset. Rejects on failure (e.g. storage quota). */
  save(data: AppData, meta: ChangeMeta): Promise<void>
  /** Remove everything stored. */
  clear(): Promise<void>
  /** Changes made elsewhere (other tabs/devices). Never fires for this tab's own saves. */
  subscribe(listener: (change: RemoteChange) => void): () => void
}
