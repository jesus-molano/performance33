// Persistence boundary. The app only talks to a Repository: LocalStorageRepository (local test mode)
// or SupabaseRepository (the shared cloud). Display windows (TV) only use the *Display methods:
// they never read private data.

import type { RowChange } from '@/lib/dataRows'
import type { AppData, DisplayData } from '@/types'

/** Identifies one change: who made it and its sequence number at that source. */
export interface ChangeMeta {
  /** Id of the tab/device that produced the change. */
  source: string
  /** Monotonic counter per source; receivers drop anything not newer than what they applied. */
  revision: number
}

/** A change made elsewhere: the whole dataset (another tab, local mode) or some rows (another coach). */
export type RemoteChange = ChangeMeta &
  (
    | { kind: 'snapshot'; data: AppData }
    | {
        kind: 'rows'
        changes: RowChange[]
        /** These rows were refused by the server: they go back to what the server has. */
        rejected?: boolean
      }
  )

export interface DisplayChange extends ChangeMeta {
  data: DisplayData
}

export interface Repository {
  /** Dashboard tabs of this browser share full data directly (local mode). In the cloud each one syncs with the server. */
  readonly sharesDataAcrossTabs: boolean
  /** Load the whole dataset, or null if nothing is stored yet. Rejects when it cannot be read (no connection). */
  load(): Promise<AppData | null>
  /**
   * Persist what changed and the sanitised display copy. Rejects on failure: the caller retries.
   * Takes a getter because a save can wait its turn: what it compares must include changes that arrived meanwhile.
   */
  save(getData: () => AppData, meta: ChangeMeta): Promise<void>
  /** Persist only the sanitised display copy (start-up, changes made elsewhere). */
  saveDisplay(data: DisplayData, meta: ChangeMeta): Promise<void>
  /** Forget this device's copies. In the cloud the shared data stays untouched. */
  clear(): Promise<void>
  /** Stop tracking the session (signed out): nothing can be saved until the next load(). */
  release(): void
  /** Changes made elsewhere (other tabs/devices). Never fires for this tab's own saves. */
  subscribe(listener: (change: RemoteChange) => void): () => void
  /** Sanitised data for display windows, or null if nothing is stored yet. */
  loadDisplaySync(): DisplayData | null
  /** Sanitised changes for display windows. */
  subscribeDisplay(listener: (change: DisplayChange) => void): () => void
}
