// Loads the sessions while something on the page needs them and keeps them fresh: live changes, focus, back on the
// network or the tab, and every CLOUD_REFETCH_INTERVAL_MS. An older read answering late is dropped.

import { addGymDays, toGymDate } from '@shared/booking'
import { SESSION_READ_DAYS } from '@shared/routine'
import { CLOUD_REFETCH_INTERVAL_MS, CLOUD_REFETCH_MIN_GAP_MS } from '@/config/app'
import { useSessionStore } from '@/store/sessionStore'
import { SESSIONS_RELOAD_DEBOUNCE_MS } from '@/features/sessions/config/sessions'
import { sessionsService } from '@/features/sessions/services/instance'
import { markSessionsFailed, resetSessionsState, setSessions } from './sessionsStore'

let users = 0
let readSeq = 0
let stopFollowing: (() => void) | null = null

async function load(): Promise<void> {
  const seq = ++readSeq
  try {
    const sessions = await sessionsService.load(addGymDays(toGymDate(Date.now()), -SESSION_READ_DAYS))
    if (seq === readSeq) setSessions(sessions)
  } catch {
    if (seq === readSeq) markSessionsFailed()
  }
}

function follow(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastReloadAt = Date.now()
  const reloadLater = () => {
    timer ??= setTimeout(() => {
      timer = null
      lastReloadAt = Date.now()
      void load()
    }, SESSIONS_RELOAD_DEBOUNCE_MS)
  }
  const reloadSoon = () => {
    if (Date.now() - lastReloadAt >= CLOUD_REFETCH_MIN_GAP_MS) reloadLater()
  }
  const onVisibility = () => {
    if (document.visibilityState === 'visible') reloadSoon()
  }
  const stopEvents = sessionsService.subscribe(reloadLater)
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

/** Loads the sessions and keeps them fresh until every caller has called the returned function. */
export function retainSessions(): () => void {
  if (users++ === 0) {
    void load()
    stopFollowing = follow()
  }
  let released = false
  return () => {
    if (released) return
    released = true
    if (--users === 0) {
      stopFollowing?.()
      stopFollowing = null
    }
  }
}

// Leaving (sign-out, access lost) forgets what the session saw.
useSessionStore.subscribe((session, previous) => {
  if (session.status === previous.status || (session.status !== 'signed-out' && session.status !== 'no-access')) return
  readSeq++
  resetSessionsState()
})
