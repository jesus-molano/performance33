// The session of this window: who is signed in and whether they are on the active staff list.
// Dashboards and TV windows run the same flow. Leaving (sign-out, no access) removes the TV copy here;
// dashboardSync watches the status and wipes the rest. Results go to useSessionStore.

import { ACCESS_RECHECK_MIN_GAP_MS, LEGACY_STORAGE_KEYS, STORAGE_KEYS } from '@/config/app'
import { removeStorage } from '@/lib/safeStorage'
import { clearDisplayCache } from '@/persistence/displayCache'
import { useSessionStore } from '@/store/sessionStore'
import { auth, teamService } from './instance'
import { readRedirectError } from './messages'
import type { AuthEvent } from './types'

const getState = () => useSessionStore.getState()
const setState = useSessionStore.setState

let started = false
let recovering = false
/** A newer check or a sign-out makes the result of an older check irrelevant. */
let checkRun = 0
let lastCheckAt = 0

function leave(status: 'signed-out' | 'no-access', userId: string | null): void {
  checkRun++
  recovering = false
  clearDisplayCache()
  setState({ status, userId, staff: null, team: [] })
}

async function checkAccess(userId: string): Promise<void> {
  const run = ++checkRun
  lastCheckAt = Date.now()
  try {
    const staff = await teamService.claimProfile()
    if (run !== checkRun || recovering) return
    if (staff) setState({ status: 'ready', userId, staff, notice: null })
    else leave('no-access', userId)
  } catch {
    // Already working: keep going, the next check will tell. On a cold start there is nothing to show.
    if (run === checkRun && !recovering && getState().status !== 'ready') setState({ status: 'offline', userId })
  }
}

function onAuthEvent(event: AuthEvent): void {
  if (event.type === 'signed-out') {
    leave('signed-out', null)
  } else if (event.type === 'recovery') {
    recovering = true
    checkRun++
    setState({ status: 'recovery', userId: event.user.id, staff: null })
  } else {
    // The login client repeats this event when the tab regains focus.
    const { status, userId } = getState()
    if (recovering || (status === 'ready' && userId === event.user.id)) return
    setState({ status: 'loading' })
    void checkAccess(event.user.id)
  }
}

/** Runs the check again: from 'offline', or because this person may have lost access meanwhile. */
export async function retrySession(): Promise<void> {
  const user = await auth.getUser()
  if (user) await checkAccess(user.id)
  else if (!recovering) leave('signed-out', null)
}

function onWindowBack(): void {
  const { status } = getState()
  if (status === 'offline' || (status === 'ready' && Date.now() - lastCheckAt >= ACCESS_RECHECK_MIN_GAP_MS)) void retrySession()
}

function removeLeftovers(): void {
  for (const key of LEGACY_STORAGE_KEYS) removeStorage(key)
  // A browser that used the demo before the cloud was configured must not keep that dataset.
  if (!auth.isLocal) for (const key of [STORAGE_KEYS.data, STORAGE_KEYS.localSession, STORAGE_KEYS.localTeam]) removeStorage(key)
}

function takeRedirectNotice(): void {
  const notice = readRedirectError(window.location.search, window.location.hash)
  if (!notice) return
  setState({ notice })
  window.history.replaceState(null, '', window.location.pathname)
}

/** Starts the session flow once per window. */
export function startSession(): void {
  if (started) return
  started = true
  removeLeftovers()
  takeRedirectNotice()
  auth.onChange(onAuthEvent)
  window.addEventListener('focus', onWindowBack)
  window.addEventListener('online', onWindowBack)
  void retrySession()
}

/** Signs out on this device. */
export async function signOut(): Promise<void> {
  await auth.signOut()
  leave('signed-out', null)
}

/** The new password is set: continue as a normal session. */
export async function finishRecovery(): Promise<void> {
  recovering = false
  await retrySession()
}

/** Reloads the team list (and this person's own row, whose role may have changed). */
export async function refreshTeam(): Promise<void> {
  const team = await teamService.list()
  const self = team.find((member) => member.id === getState().staff?.id)
  if (self?.active) setState({ team, staff: self })
  else if (getState().status === 'ready') void retrySession()
}

/** Keeps the team list live while a dashboard is open. */
export function watchTeam(): () => void {
  return teamService.subscribe(() => void refreshTeam().catch(() => undefined))
}
