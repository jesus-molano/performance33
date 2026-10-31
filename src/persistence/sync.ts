// Live cross-tab sync: BroadcastChannel (instant) + repository subscription (storage event /
// future backend). The same change can arrive through both paths, so every receiver
// filters by (source, revision) and ignores its own tab.

import { toDisplayData } from '../lib/display'
import type { DisplayData } from '../types'
import { listenDataChannel, listenDisplayChannel } from './channels'
import { repository } from './repositoryInstance'
import type { ChangeMeta, RemoteChange } from './repository'
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

/** Display/TV windows: SANITISED data only (repository changes are sanitised here). */
export function subscribeDisplayChanges(listener: (data: DisplayData) => void): () => void {
  const accept = createChangeFilter()
  const stopChannel = listenDisplayChannel((message) => {
    if (accept(message)) listener(message.data)
  })
  const stopRepository = repository.subscribe((change) => {
    if (accept(change)) listener(toDisplayData(change.data))
  })
  return () => {
    stopChannel()
    stopRepository()
  }
}

/** One-shot sanitised read of the stored data (initial load of display windows). */
export function loadDisplayData(): DisplayData | null {
  const data = repository.loadSync()
  return data ? toDisplayData(data) : null
}
