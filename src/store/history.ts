// Undo/redo and history-free data replacement (hydration, other tabs).

import type { AppData } from '@/types'
import { undoGrouper, useAppStore } from './appStore'

const history = () => useAppStore.temporal.getState()

export function undo(): void {
  undoGrouper.reset()
  history().undo()
}

export function redo(): void {
  undoGrouper.reset()
  history().redo()
}

/** Next edit starts a new undo step (call on input blur). */
export function breakUndoGroup(): void {
  undoGrouper.reset()
}

export function clearHistory(): void {
  undoGrouper.reset()
  history().clear()
}

/** Runs a store change without recording an undo step (housekeeping such as discarding an empty row). */
export function withoutHistory(change: () => void): void {
  history().pause()
  try {
    change()
  } finally {
    history().resume()
  }
}

/**
 * Replaces data with a change made in another tab (or an import there). Undo snapshots are whole
 * datasets, so older local steps would silently revert the remote change: history restarts here.
 */
export function applyRemoteData(data: AppData): void {
  withoutHistory(() => useAppStore.setState({ data }))
  clearHistory()
}

/** Initial load: set data and start with an empty history. */
export function hydrateData(data: AppData): void {
  applyRemoteData(data)
}

/** Opaque marker of the current data version (compare later with isLatestData). */
export function currentDataVersion(): AppData {
  return useAppStore.getState().data
}

/** True when nothing has changed since `version` was taken. */
export function isLatestData(version: AppData): boolean {
  return useAppStore.getState().data === version
}

/** Calls `listener` on every data change (local, undo/redo or remote). Returns an unsubscribe. */
export function onDataChange(listener: () => void): () => void {
  return useAppStore.subscribe((state, previous) => {
    if (state.data !== previous.data) listener()
  })
}
