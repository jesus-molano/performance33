// Keeps undo history honest when someone else changes a row (pure, no store access).

import { applyRowChanges, diffData, type RowChange } from '@/lib/dataRows'
import type { AppData } from '@/types'

type Snapshot = { data?: AppData }

/**
 * Puts the same rows in every undo/redo snapshot, then drops the steps that no longer change anything
 * (so Ctrl+Z never seems to do nothing). `snapshots` go from the farthest to the nearest to `current`:
 * that is the order of both zundo lists.
 */
export function rebaseSnapshots<S extends Snapshot>(snapshots: readonly S[], changes: readonly RowChange[], current: AppData): S[] {
  const kept: S[] = []
  let next = current
  for (let i = snapshots.length - 1; i >= 0; i--) {
    const snapshot = snapshots[i]
    if (!snapshot.data) continue
    const data = applyRowChanges(snapshot.data, changes)
    if (diffData(data, next).length === 0) continue
    kept.unshift({ ...snapshot, data })
    next = data
  }
  return kept
}
