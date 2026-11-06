// Loads what the page shows (a day, the timetable, a user's classes) and keeps it fresh while it is on screen:
// live changes, focus, back on the network or the tab, every CLOUD_REFETCH_INTERVAL_MS, and right after each action.

import { CLOUD_REFETCH_INTERVAL_MS, CLOUD_REFETCH_MIN_GAP_MS } from '@/config/app'
import { useSessionStore } from '@/store/sessionStore'
import { CLASSES_RELOAD_DEBOUNCE_MS } from '@/features/classes/config/classes'
import { classesService } from '@/features/classes/services/instance'
import { keyId, readResource, resetClassesState, useClassesStore, writeResource, type ClassesKey } from './classesStore'

interface Retained {
  key: ClassesKey
  users: number
}

const retained = new Map<string, Retained>()
/** The newest read of each key: an older one that answers later is dropped. */
const readSeq = new Map<string, number>()
let stopFollowing: (() => void) | null = null

function fetchKey(key: ClassesKey): Promise<unknown> {
  if (key.kind === 'day') return classesService.loadDay(key.date)
  if (key.kind === 'client') return classesService.loadClient(key.clientId)
  return classesService.loadSchedule()
}

async function load(key: ClassesKey): Promise<void> {
  const id = keyId(key)
  const seq = (readSeq.get(id) ?? 0) + 1
  readSeq.set(id, seq)
  const current = readResource(useClassesStore.getState(), key)
  if (current.status === 'error') writeResource(key, { status: 'loading', data: current.data })
  try {
    const data = await fetchKey(key)
    if (readSeq.get(id) === seq) writeResource(key, { status: 'ready', data })
  } catch {
    if (readSeq.get(id) === seq) writeResource(key, { status: 'error', data: readResource(useClassesStore.getState(), key).data })
  }
}

/** Everything on screen, read again now. */
export function reloadClasses(): Promise<void> {
  return Promise.all([...retained.values()].map(({ key }) => load(key))).then(() => undefined)
}

function follow(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastReloadAt = Date.now()
  const reloadLater = () => {
    timer ??= setTimeout(() => {
      timer = null
      lastReloadAt = Date.now()
      void reloadClasses()
    }, CLASSES_RELOAD_DEBOUNCE_MS)
  }
  const reloadSoon = () => {
    if (Date.now() - lastReloadAt >= CLOUD_REFETCH_MIN_GAP_MS) reloadLater()
  }
  const onVisibility = () => {
    if (document.visibilityState === 'visible') reloadSoon()
  }
  const stopEvents = classesService.subscribe(reloadLater)
  const interval = setInterval(reloadLater, CLOUD_REFETCH_INTERVAL_MS)
  window.addEventListener('focus', reloadSoon)
  window.addEventListener('online', reloadLater)
  document.addEventListener('visibilitychange', onVisibility)
  return () => {
    stopEvents()
    clearInterval(interval)
    if (timer) clearTimeout(timer)
    window.removeEventListener('focus', reloadSoon)
    window.removeEventListener('online', reloadLater)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}

/** Loads that key and keeps it fresh until the returned function is called (by every caller that asked for it). */
export function retainClasses(key: ClassesKey): () => void {
  const id = keyId(key)
  const entry = retained.get(id)
  if (entry) entry.users++
  else retained.set(id, { key, users: 1 })
  if (!entry) void load(key)
  stopFollowing ??= follow()
  let released = false
  return () => {
    if (released) return
    released = true
    const current = retained.get(id)
    if (current && --current.users <= 0) retained.delete(id)
    if (retained.size === 0) {
      stopFollowing?.()
      stopFollowing = null
    }
  }
}

// Leaving (sign-out, access lost) forgets what the session saw.
useSessionStore.subscribe((session, previous) => {
  if (session.status === previous.status || (session.status !== 'signed-out' && session.status !== 'no-access')) return
  readSeq.clear()
  resetClassesState()
})
