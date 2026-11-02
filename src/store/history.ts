// Undo/redo and history-free data changes (hydration, changes made elsewhere).

import { applyRowChanges, hasLocalEdit, type RowChange } from '@/lib/dataRows'
import type { AppData } from '@/types'
import { undoGrouper, useAppStore } from './appStore'
import { rebaseSnapshots } from './rebase'

const history = () => useAppStore.temporal.getState()

let applyingRemoteRows = false

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
 * Applies rows changed by someone else (another coach, another tab) without an undo step. Undo
 * snapshots are whole datasets, so every snapshot gets the same rows: undo can never bring back an
 * older version of another coach's work. A row with unsaved local edits keeps them (last write wins).
 */
export function applyRemoteRows(changes: readonly RowChange[]): void {
  if (changes.length === 0) return
  const current = useAppStore.getState().data
  const next = applyRowChanges(current, changes.filter((change) => !hasLocalEdit(current, change)))
  applyingRemoteRows = true
  withoutHistory(() => useAppStore.setState({ data: next }))
  const { pastStates, futureStates } = history()
  useAppStore.temporal.setState({
    pastStates: rebaseSnapshots(pastStates, changes, next),
    futureStates: rebaseSnapshots(futureStates, changes, next),
  })
  applyingRemoteRows = false
}

/** Initial load: set data and start with an empty history. */
export function hydrateData(data: AppData): void {
  withoutHistory(() => useAppStore.setState({ data }))
  clearHistory()
}

export interface UndoStepWatch {
  /** True while undoing would undo exactly the step being watched. */
  isCurrent: () => boolean
  stop: () => void
}

/**
 * Watches the undo step just recorded. `onGone` fires on any further local change, or when a change
 * from another coach dropped steps. Other changes from other coaches leave it alone: they are in the snapshots too.
 */
export function watchLatestUndoStep(onGone: () => void): UndoStepWatch {
  const depth = history().pastStates.length
  const isCurrent = () => history().pastStates.length === depth
  const stopData = useAppStore.subscribe((state, previous) => {
    if (state.data !== previous.data && !applyingRemoteRows) onGone()
  })
  const stopHistory = useAppStore.temporal.subscribe(() => {
    if (!isCurrent()) onGone()
  })
  return {
    isCurrent,
    stop: () => {
      stopData()
      stopHistory()
    },
  }
}
