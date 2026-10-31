// Live cross-tab sync: BroadcastChannel (instant) + repository subscription (storage event /
// future backend). The same change can arrive through both paths, so every receiver
// filters by (source, revision) and ignores its own tab.

import type { DisplayData } from '@/types'
import { listenDataChannel, listenDisplayChannel } from './channels'
import type { ChangeMeta, DisplayChange, RemoteChange } from './repository'
import { repository } from './repositoryInstance'
import { TAB_ID } from './tabId'

/** Accepts a change only once per (source, revision) and never from this tab. */
export function createChangeFilter(): (meta: ChangeMeta) => boolean {
  const lastRevision = new Map<string, number>()
  return ({ source, revision }) => {
    if (source === TAB_ID) return false
    if (revision <= (lastRevision.get(source) ?? -1)) return false
    lastRevision.set(source, revision)
    return true
  }
}

/**
 * Dashboard tabs: full data changes from other tabs. The listener must apply the data WITHOUT
 * undo history and WITHOUT saving/broadcasting it again (see startDashboardSync).
 */
export function subscribeRemoteChanges(listener: (change: RemoteChange) => void): () => void {
  const accept = createChangeFilter()
  const onChange = (change: RemoteChange) => {
    if (accept(change)) listener(change)
  }
  const stopChannel = listenDataChannel(onChange)
  const stopRepository = repository.subscribe(onChange)
  return () => {
    stopChannel()
    stopRepository()
  }
}

/** Display/TV windows: only ever receive the SANITISED copy (display channel + display key). */
export function subscribeDisplayChanges(listener: (data: DisplayData) => void): () => void {
  const accept = createChangeFilter()
  const onChange = (change: DisplayChange) => {
    if (accept(change)) listener(change.data)
  }
  const stopChannel = listenDisplayChannel(onChange)
  const stopRepository = repository.subscribeDisplay(onChange)
  return () => {
    stopChannel()
    stopRepository()
  }
}

/** One-shot read of the sanitised copy (initial load of display windows). */
export function loadDisplayData(): DisplayData | null {
  return repository.loadDisplaySync()
}
