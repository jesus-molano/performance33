// Wires the data store to persistence for DASHBOARD windows:
// local change → broadcast immediately (live TV) + debounced save + 'Guardando…/Guardado';
// remote change → applied without undo history and without re-saving (no echo loops).

import { SAVE_DEBOUNCE_MS } from '@/config/app'
import { createSeedData } from '@/data/seed'
import { debounce } from '@/lib/debounce'
import { toDisplayData } from '@/lib/display'
import { applyRemoteData, hydrateData, useAppStore, useUiStore } from '@/store'
import { broadcastChange } from './channels'
import type { ChangeMeta } from './repository'
import { repository } from './repositoryInstance'
import { subscribeRemoteChanges } from './sync'
import { TAB_ID } from './tabId'

let initialized = false
let revision = 0
let applyingRemote = false

const nextMeta = (): ChangeMeta => ({ source: TAB_ID, revision: ++revision })
const setSaveStatus = useUiStore.getState().setSaveStatus

async function saveCurrent(meta: ChangeMeta): Promise<void> {
  try {
    await repository.save(useAppStore.getState().data, meta)
    setSaveStatus('saved')
  } catch {
    setSaveStatus('error')
  }
}

/** Loads stored data (or seeds the demo on first run) into the store. Idempotent. */
export function initDashboardData(): void {
  if (initialized) return
  initialized = true
  const stored = repository.loadSync()
  hydrateData(stored ?? createSeedData())
  if (!stored) void saveCurrent(nextMeta())
  // Data saved by an older version has no display copy yet: write it so TV windows can load.
  else repository.saveDisplay(toDisplayData(stored), nextMeta()).catch(() => setSaveStatus('error'))
}

/** Starts autosave + live sync. Returns a cleanup that flushes pending saves. */
export function startDashboardSync(): () => void {
  let pendingMeta: ChangeMeta = { source: TAB_ID, revision }
  const save = debounce(() => void saveCurrent(pendingMeta), SAVE_DEBOUNCE_MS)

  const stopStore = useAppStore.subscribe((state, previous) => {
    if (state.data === previous.data || applyingRemote) return
    pendingMeta = nextMeta()
    broadcastChange(state.data, pendingMeta)
    setSaveStatus('saving')
    save()
  })

  const stopRemote = subscribeRemoteChanges((change) => {
    applyingRemote = true
    applyRemoteData(change.data)
    applyingRemote = false
  })

  const onPageHide = () => save.flush()
  window.addEventListener('pagehide', onPageHide)

  return () => {
    save.flush()
    stopStore()
    stopRemote()
    window.removeEventListener('pagehide', onPageHide)
  }
}
