// Loads and follows the screens while something on the page needs them. Catches up like the routine data: when
// (re)connected, on focus, back on the network or the tab, and every CLOUD_REFETCH_INTERVAL_MS.

import { CLOUD_REFETCH_INTERVAL_MS, CLOUD_REFETCH_MIN_GAP_MS, CLOUD_REFETCH_RETRY_MS } from '@/config/app'
import { screensService } from '@/features/screens/services/instance'
import type { ScreensSnapshot } from '@/features/screens/types'
import { defaultScreens, toSectionMap } from '@/features/screens/utils/sections'
import { applyEvent, mergeSnapshot } from '@/features/screens/utils/snapshot'
import { pendingWrites, useScreensStore } from './screensStore'

interface Connection {
  reload: () => void
  stop: () => void
}

let users = 0
let connection: Connection | null = null

function writeCache(): void {
  const { screens, sections } = useScreensStore.getState()
  screensService.cache?.write({ screens, sections: Object.values(sections) })
}

function connect(): Connection {
  const store = useScreensStore
  const cached = screensService.cache?.read()
  if (cached && store.getState().status === 'idle') {
    store.setState({ status: 'cached', screens: cached.screens, sections: toSectionMap(cached.sections) })
  }

  let stopped = false
  let lastFetchAt = 0
  let eventsSeen = 0
  let defaultsAsked = false
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  const reload = async (): Promise<void> => {
    const eventsAtStart = eventsSeen
    lastFetchAt = Date.now()
    let snapshot: ScreensSnapshot
    try {
      snapshot = await screensService.load()
    } catch {
      return
    }
    if (stopped) return
    // A live change landed while reading: this copy may not include it.
    if (eventsAtStart !== eventsSeen) {
      retryTimer ??= setTimeout(() => {
        retryTimer = null
        void reload()
      }, CLOUD_REFETCH_RETRY_MS)
      return
    }
    store.setState((state) => ({ status: 'ready', ...mergeSnapshot(state, snapshot, pendingWrites.accept) }))
    writeCache()
    // The gym has no screens yet: the defaults, never over one another window created meanwhile.
    if (!snapshot.screens.length && !defaultsAsked) {
      defaultsAsked = true
      void screensService.saveScreens(defaultScreens(), true).then(reload, () => undefined)
    }
  }

  const reloadNow = () => void reload()
  const reloadSoon = () => {
    if (Date.now() - lastFetchAt >= CLOUD_REFETCH_MIN_GAP_MS) void reload()
  }
  const onVisibility = () => {
    if (document.visibilityState === 'visible') reloadSoon()
  }

  const stopEvents = screensService.subscribe((event) => {
    eventsSeen++
    store.setState((state) => applyEvent(state, event, pendingWrites.accept))
    writeCache()
  }, reloadNow)
  const stopPresence = screensService.presence.watch((online) => store.setState({ online }))
  const interval = setInterval(reloadNow, CLOUD_REFETCH_INTERVAL_MS)
  window.addEventListener('focus', reloadSoon)
  window.addEventListener('online', reloadNow)
  document.addEventListener('visibilitychange', onVisibility)
  void reload()

  return {
    reload: reloadNow,
    stop: () => {
      stopped = true
      stopEvents()
      stopPresence()
      clearInterval(interval)
      window.removeEventListener('focus', reloadSoon)
      window.removeEventListener('online', reloadNow)
      document.removeEventListener('visibilitychange', onVisibility)
      if (retryTimer) clearTimeout(retryTimer)
    },
  }
}

/** Keeps the screens loaded and live until every caller has called the function it got back. */
export function retainScreens(): () => void {
  users++
  connection ??= connect()
  let released = false
  return () => {
    if (released) return
    released = true
    users--
    if (users > 0) return
    connection?.stop()
    connection = null
  }
}

/** After a refused or failed write: back to what the server has. */
export function reloadScreens(): void {
  connection?.reload()
}
