// Live sync: BroadcastChannel (instant, same browser) + repository subscription (storage event /
// the cloud). The same change can arrive through both paths, so every receiver
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
 * Dashboard tabs: data changes made elsewhere. The listener must apply them WITHOUT
 * undo history and WITHOUT saving them again (see startDashboardSync).
 */
export function subscribeRemoteChanges(listener: (change: RemoteChange) => void): () => void {
  const accept = createChangeFilter()
  const onChange = (change: RemoteChange) => {
    if (accept(change)) listener(change)
  }
  const stopChannel = repository.sharesDataAcrossTabs ? listenDataChannel(onChange) : () => undefined
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
