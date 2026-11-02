// The session of this window: who is signed in and whether their account gives access.
// Dashboards and TV windows run the same flow. Leaving (sign-out, no access) removes the TV copy here;
// dashboardSync watches the status and wipes the rest. Results go to useSessionStore.

import { ACCESS_RECHECK_MIN_GAP_MS, LEGACY_STORAGE_KEYS, STORAGE_KEYS } from '@/config/app'
import { readStorage, removeStorage } from '@/lib/safeStorage'
import { clearDisplayCache } from '@/persistence/displayCache'
import { useSessionStore } from '@/store/sessionStore'
import { useToastStore } from '@/store/toastStore'
import type { Profile } from '@/types'
import { auth, teamService } from './instance'
import { readRedirectError } from './messages'
import type { AuthEvent, AuthUser } from './types'

const getState = () => useSessionStore.getState()
const setState = useSessionStore.setState

let started = false
/** A newer check or a sign-out makes the result of an older check irrelevant. */
let checkRun = 0
let lastCheckAt = 0

function leave(status: 'signed-out' | 'no-access', user: AuthUser | null): void {
  checkRun++
  clearDisplayCache()
  setState({ status, userId: user?.id ?? null, email: user?.email ?? null, profile: null, team: [] })
}

function enter(user: AuthUser, profile: Profile): void {
  // A problem connecting Google comes back here: inside the app, the login page cannot show it.
  const { notice } = getState()
  if (notice) useToastStore.getState().show({ message: notice, tone: 'error' })
  setState({ status: profile.mustChangePassword ? 'must-change-password' : 'ready', userId: user.id, email: user.email, profile, notice: null })
}

async function checkAccess(user: AuthUser): Promise<void> {
  const run = ++checkRun
  lastCheckAt = Date.now()
  try {
    const profile = await teamService.getOwnProfile()
    if (run !== checkRun) return
    if (profile) enter(user, profile)
    else leave('no-access', user)
  } catch {
    // Already working: keep going, the next check will tell. On a cold start there is nothing to show.
    if (run === checkRun && getState().status !== 'ready') setState({ status: 'offline', userId: user.id, email: user.email })
  }
}

function onAuthEvent(event: AuthEvent): void {
  if (event.type === 'signed-out') {
    leave('signed-out', null)
    return
  }
  // The login client repeats this event when the tab regains focus.
  const { status, userId } = getState()
  if ((status === 'ready' || status === 'must-change-password') && userId === event.user.id) return
  setState({ status: 'loading' })
  void checkAccess(event.user)
}

/** Runs the check again: from 'offline', or because this person may have lost access meanwhile. */
export async function retrySession(): Promise<void> {
  let user: AuthUser | null
  try {
    user = await auth.getUser()
  } catch {
    // Could not check, which is not the same as signed out: leaving now would lose unsaved work.
    if (getState().status !== 'ready') setState({ status: 'offline' })
    return
  }
  if (user) await checkAccess(user)
  else leave('signed-out', null)
}

function onWindowBack(): void {
  const { status } = getState()
  if (status === 'offline' || (status === 'ready' && Date.now() - lastCheckAt >= ACCESS_RECHECK_MIN_GAP_MS)) void retrySession()
}

function removeLeftovers(): void {
  for (const key of LEGACY_STORAGE_KEYS) removeStorage(key)
  // A browser that used the demo before the cloud was configured must not keep that dataset.
  if (!auth.isLocal) for (const key of [STORAGE_KEYS.data, STORAGE_KEYS.localSession, STORAGE_KEYS.localTeam]) removeStorage(key)
  // And the other way round: a site moved from the cloud back to the demo must not keep the login or the TV copy.
  else if (readStorage(STORAGE_KEYS.cloudSession)) for (const key of [STORAGE_KEYS.cloudSession, STORAGE_KEYS.display]) removeStorage(key)
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

/** The temporary password has been replaced: lift the flag and continue as a normal session. */
export async function finishPasswordChange(): Promise<void> {
  await teamService.finishPasswordChange()
  await retrySession()
}

/** Reloads the team list (and this person's own row, whose role may have changed). */
export async function refreshTeam(): Promise<void> {
  const team = await teamService.list()
  const { profile, status } = getState()
  const self = team.find((member) => member.id === profile?.id)
  if (profile && self?.active) setState({ team, profile: { ...profile, ...self } })
  else if (status === 'ready') void retrySession()
}

/** After a change that already worked: a failed reload must not look like a failed change. Live updates catch up later. */
export function refreshTeamQuietly(): Promise<void> {
  return refreshTeam().catch(() => undefined)
}

/** Keeps the team list live while a dashboard is open. */
export function watchTeam(): () => void {
  return teamService.subscribe(() => void refreshTeamQuietly())
}
