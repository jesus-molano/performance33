// Undo/redo and history-free data replacement (hydration, other tabs).

import type { AppData } from '../types'
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

/** Replace data WITHOUT recording undo history (changes made in another tab). */
export function applyRemoteData(data: AppData): void {
  history().pause()
  useAppStore.setState({ data })
  history().resume()
}

/** Initial load: set data and start with an empty history. */
export function hydrateData(data: AppData): void {
  applyRemoteData(data)
  clearHistory()
}
