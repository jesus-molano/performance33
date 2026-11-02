// Wires the data store to persistence for DASHBOARD windows:
// local change → live update to TV windows + debounced save + 'Guardando…/Guardado', retried until it works;
// change made elsewhere → applied without undo history and without re-saving (no echo loops), and passed on to TV windows.

import { SAVE_DEBOUNCE_MS, SAVE_RETRY_DELAYS_MS } from '@/config/app'
import { createSeedData } from '@/data/seed'
import { refreshTeam, watchTeam } from '@/auth'
import { debounce } from '@/lib/debounce'
import { diffData } from '@/lib/dataRows'
import { toDisplayData } from '@/lib/display'
import { createEmptyData } from '@/lib/factories'
import { applyRemoteRows, hydrateData, useAppStore, useSessionStore, useToastStore, useUiStore } from '@/store'
import type { AppData } from '@/types'
import { broadcastChange, broadcastDisplay } from './channels'
import type { ChangeMeta, RemoteChange } from './repository'
import { repository } from './repositoryInstance'
import { subscribeRemoteChanges } from './sync'
import { TAB_ID } from './tabId'

const REJECTED_MESSAGE = 'Ese cambio no se ha guardado porque no tienes permiso.'

let revision = 0
let applyingRemote = false
let flushActive: (() => Promise<boolean>) | null = null

const nextMeta = (): ChangeMeta => ({ source: TAB_ID, revision: ++revision })
const getData = (): AppData => useAppStore.getState().data
const setSaveStatus = useUiStore.getState().setSaveStatus

/** Reads the dataset and the team. Rejects without connection (the dashboard offers to retry). */
export async function loadDashboardData(): Promise<AppData | null> {
  const [data] = await Promise.all([repository.load(), refreshTeam()])
  return data
}

/** Puts loaded data in the store. Only local mode seeds by itself; an empty cloud waits for an admin. */
export function hydrateDashboard(stored: AppData | null): void {
  const data = stored ?? createSeedData()
  hydrateData(data)
  const meta = nextMeta()
  const saved = stored ? repository.saveDisplay(toDisplayData(data), meta) : repository.save(() => data, meta)
  saved.catch(() => setSaveStatus('error'))
}

function applyRemoteChange(change: RemoteChange): void {
  const changes = change.kind === 'snapshot' ? diffData(getData(), change.data) : change.changes
  if (changes.length === 0) return
  applyingRemote = true
  applyRemoteRows(changes)
  applyingRemote = false
  const display = toDisplayData(getData())
  const meta = nextMeta()
  broadcastDisplay(display, meta)
  repository.saveDisplay(display, meta).catch(() => undefined)
  if (change.kind === 'rows' && change.rejected) useToastStore.getState().show({ message: REJECTED_MESSAGE, tone: 'error' })
}

/** Starts autosave + live sync. The cleanup saves what is pending; a sign-out drops everything instead. */
export function startDashboardSync(): () => void {
  let stopped = false
  let failures = 0
  let localChanges = 0
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  const clearRetry = () => {
    if (retryTimer) clearTimeout(retryTimer)
    retryTimer = null
  }

  const saveLatest = async (): Promise<boolean> => {
    clearRetry()
    const changesAtStart = localChanges
    try {
      await repository.save(getData, nextMeta())
      failures = 0
      if (!stopped && changesAtStart === localChanges) setSaveStatus('saved')
      return true
    } catch {
      if (stopped) return false
      setSaveStatus('error')
      const delay = SAVE_RETRY_DELAYS_MS[Math.min(failures++, SAVE_RETRY_DELAYS_MS.length - 1)]
      retryTimer = setTimeout(() => void saveLatest(), delay)
      return false
    }
  }

  const save = debounce(() => void saveLatest(), SAVE_DEBOUNCE_MS)

  const stopStore = useAppStore.subscribe((state, previous) => {
    if (state.data === previous.data || applyingRemote) return
    localChanges++
    broadcastChange(state.data, nextMeta(), repository.sharesDataAcrossTabs)
    setSaveStatus('saving')
    clearRetry()
    save()
  })

  const stopRemote = subscribeRemoteChanges(applyRemoteChange)
  const stopTeam = watchTeam()

  const retryNow = () => {
    if (useUiStore.getState().saveStatus === 'error') void saveLatest()
  }
  const onPageHide = () => save.flush()
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    const { saveStatus } = useUiStore.getState()
    if (saveStatus === 'saving' || saveStatus === 'error') event.preventDefault()
  }
  window.addEventListener('online', retryNow)
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('beforeunload', onBeforeUnload)

  const stop = () => {
    stopped = true
    clearRetry()
    stopStore()
    stopRemote()
    stopTeam()
    stopSession()
    flushActive = null
    window.removeEventListener('online', retryNow)
    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('beforeunload', onBeforeUnload)
  }

  // Order matters: stop listening BEFORE emptying the store, or the empty data would be saved as a mass delete.
  const stopSession = useSessionStore.subscribe((session) => {
    if (stopped || session.status === 'ready') return
    save.cancel()
    stop()
    repository.release()
    hydrateData(createEmptyData())
    setSaveStatus('idle')
  })

  flushActive = () => {
    save.cancel()
    return saveLatest()
  }

  return () => {
    if (stopped) return
    save.flush()
    stop()
  }
}

/** Saves what is pending now. False when it could not be saved (no connection). */
export function flushDashboardSaves(): Promise<boolean> {
  return flushActive ? flushActive() : Promise.resolve(true)
}
