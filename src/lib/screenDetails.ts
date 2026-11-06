// Which screens this computer has (Window Management API, Chrome and Edge): the TVs extended with Win+K show up as
// screens of their own, so each TV window can open on its TV. The browser is passed in, so tests use fakes.

/** Detection result: no API (Firefox, Safari), permission not asked yet, permission blocked, one screen only, TVs found. */
export type ScreenDetectionState = 'unsupported' | 'needs-permission' | 'denied' | 'single' | 'ok'

/** Available area of a screen, in the coordinates of the whole desktop. */
export interface ScreenArea {
  left: number
  top: number
  width: number
  height: number
}

/** The part of a ScreenDetailed this app reads (also what `requestFullscreen({ screen })` takes). */
export interface ScreenLike {
  availLeft: number
  availTop: number
  availWidth: number
  availHeight: number
  left: number
  top: number
  isPrimary: boolean
  isInternal: boolean
  label: string
}

export interface ScreenDetailsLike extends EventTarget {
  readonly screens: readonly ScreenLike[]
}

export interface PermissionLike extends EventTarget {
  readonly state: PermissionState
}

export interface ScreenEnv {
  /** `window.screen`: `isExtended` and its `change` event work without permission. */
  screen: EventTarget & { readonly isExtended?: boolean }
  getScreenDetails?: () => Promise<ScreenDetailsLike>
  /** The 'window-management' permission, or null when the browser cannot say. */
  queryPermission: () => Promise<PermissionLike | null>
}

export interface DetectedDisplay {
  /** Stable name of this screen on this computer (what the device remembers for each Pantalla). */
  key: string
  label: string
  isPrimary: boolean
  isInternal: boolean
  area: ScreenArea
  source: ScreenLike
}

export interface ScreenDetection {
  state: ScreenDetectionState
  displays: readonly DetectedDisplay[]
}

export interface ScreenDetector {
  getSnapshot: () => ScreenDetection
  subscribe: (listener: () => void) => () => void
  /** Asks for the permission (must run inside a click) and reads the screens. */
  request: () => Promise<void>
}

const UNNAMED_SCREEN = 'Pantalla externa'

/** Two identical TVs share a label, so their position tells them apart. */
export function toDetectedDisplays(screens: readonly ScreenLike[]): DetectedDisplay[] {
  return screens.map((screen, index) => {
    const label = screen.label.trim() || `${UNNAMED_SCREEN} ${index + 1}`
    const unique = screens.filter((other) => other.label.trim() === screen.label.trim()).length === 1
    return {
      key: unique && screen.label.trim() ? label : `${label}@${screen.left},${screen.top}`,
      label,
      isPrimary: screen.isPrimary,
      isInternal: screen.isInternal,
      area: { left: screen.availLeft, top: screen.availTop, width: screen.availWidth, height: screen.availHeight },
      source: screen,
    }
  })
}

export function detectionFromScreens(screens: readonly ScreenLike[]): ScreenDetection {
  const displays = toDetectedDisplays(screens)
  return { state: displays.length > 1 ? 'ok' : 'single', displays }
}

const NO_DISPLAYS: readonly DetectedDisplay[] = []
const stateOnly = (state: ScreenDetectionState): ScreenDetection => ({ state, displays: NO_DISPLAYS })

/** Follows the screens while someone listens: new or lost TVs, a permission granted or blocked in the browser. */
export function createScreenDetector(env: ScreenEnv): ScreenDetector {
  const supported = Boolean(env.getScreenDetails)
  let snapshot: ScreenDetection = stateOnly(supported ? 'needs-permission' : 'unsupported')
  const listeners = new Set<() => void>()
  let details: ScreenDetailsLike | null = null
  let permission: PermissionLike | null = null
  let run = 0

  const set = (next: ScreenDetection) => {
    snapshot = next
    listeners.forEach((listener) => listener())
  }
  const readDetails = () => {
    if (details) set(detectionFromScreens(details.screens))
  }
  const follow = (next: ScreenDetailsLike) => {
    if (details === next) return
    details?.removeEventListener('screenschange', readDetails)
    details = next
    details.addEventListener('screenschange', readDetails)
  }

  const refresh = async () => {
    const current = ++run
    if (env.screen.isExtended === false) {
      set(stateOnly('single'))
      return
    }
    if (!permission) {
      permission = await env.queryPermission().catch(() => null)
      permission?.addEventListener('change', refresh)
    }
    if (current !== run) return
    if (permission?.state === 'denied') set(stateOnly('denied'))
    else if (permission?.state !== 'granted' || !env.getScreenDetails) set(stateOnly('needs-permission'))
    else await load(current)
  }

  const load = async (current: number) => {
    try {
      const next = await env.getScreenDetails?.()
      if (!next || current !== run) return
      follow(next)
      readDetails()
    } catch {
      // Closing the browser's question leaves it to ask again; 'Bloquear' (or no answer at all) is a no.
      if (current === run) set(stateOnly(permission?.state === 'prompt' ? 'needs-permission' : 'denied'))
    }
  }

  const start = () => {
    env.screen.addEventListener('change', refresh)
    void refresh()
  }
  const stop = () => {
    run++
    env.screen.removeEventListener('change', refresh)
    permission?.removeEventListener('change', refresh)
    details?.removeEventListener('screenschange', readDetails)
    permission = null
    details = null
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      if (supported && listeners.size === 1) start()
      return () => {
        listeners.delete(listener)
        if (supported && listeners.size === 0) stop()
      }
    },
    request: () => (supported ? load(++run) : Promise.resolve()),
  }
}
