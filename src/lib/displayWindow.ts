// window.open helpers for the TV windows (named screens, 1-6 sections each).
// MUST be called synchronously inside a click handler, otherwise popup blockers kick in.

import { PHONE_SCREEN_QUERY, POPUP_SCREEN_MARGIN, SCREEN_WINDOW_NAMES, TV_DEFAULT_SCREEN, TV_WINDOW_CASCADE_PX, TV_WINDOW_SIZE } from '@/config/app'
import { absoluteHashUrl, paths } from './routes'
import type { ScreenArea } from './screenDetails'

export interface WindowSize {
  width: number
  height: number
}

/** Modo TV: as wide as the screen allows (max 1600) with a 16:9 ratio. */
export function tvWindowSize(availWidth: number, availHeight: number): WindowSize {
  const width = Math.min(TV_WINDOW_SIZE.width, availWidth - POPUP_SCREEN_MARGIN, ((availHeight - POPUP_SCREEN_MARGIN) * 16) / 9)
  return { width: Math.round(width), height: Math.round((width * 9) / 16) }
}

/** Each named screen has its own window, so opening one never touches another. */
export const tvWindowName = (screen: number): string => `${SCREEN_WINDOW_NAMES.tv}${screen}`

/** This window was opened as a TV window from a computer (old one-client 'p33-pantalla-' popups count too) (a phone never opens popups, see isPhoneScreen). */
export function isScreenPopup(windowName: string): boolean {
  return Object.values(SCREEN_WINDOW_NAMES).some((prefix) => windowName.startsWith(prefix))
}

/** A phone: screens open in this same tab, as normal pages. Read it inside the click handler. */
export function isPhoneScreen(): boolean {
  return window.matchMedia(PHONE_SCREEN_QUERY).matches && !isScreenPopup(window.name)
}

/** Where a popup goes: centred on the given screen area, moved by `cascade` px. */
export function popupFeatures(size: WindowSize, area: ScreenArea, cascade = 0): string {
  const left = Math.round(area.left + Math.max(0, (area.width - size.width) / 2 + cascade))
  const top = Math.round(area.top + Math.max(0, (area.height - size.height) / 2 + cascade))
  return `popup=yes,width=${size.width},height=${size.height},left=${left},top=${top}`
}

/** Available area of the screen this window is on. */
function currentScreenArea(): ScreenArea {
  const { availWidth, availHeight } = window.screen
  return { left: 0, top: 0, width: availWidth, height: availHeight }
}

/** Opens (or focuses) a named popup on a screen area (this screen when none). Returns null when the browser blocked it. */
export function openPopup(url: string, name: string, size: WindowSize, area: ScreenArea = currentScreenArea(), cascade = 0): Window | null {
  try {
    const win = window.open(url, name, popupFeatures(size, area, cascade))
    win?.focus()
    return win
  } catch {
    return null
  }
}

export function tvWindowUrl(screen: number): string {
  return absoluteHashUrl(paths.tv(screen))
}

const tvWindows = new Map<number, Window>()

/**
 * Window of a named screen. With a target (the whole TV detected for it, `DetectedDisplay.bounds`) it covers that TV
 * even before going fullscreen, so nobody has to drag it; without one it is a 16:9 window on this screen. If this tab
 * already opened it, it is focused (and moved to the target), not reloaded. A window this tab lost track of (the page
 * was reloaded) is found by its name; it puts itself back on its TV when told (`place` over p33-tv-control).
 */
export function openTvWindow(screen: number, target: ScreenArea | null = null): Window | null {
  const current = tvWindows.get(screen)
  if (current && !current.closed) {
    if (target) moveWindowTo(current, target)
    current.focus()
    return current
  }
  const url = tvWindowUrl(screen)
  const name = tvWindowName(screen)
  const opened = target
    ? openPopup(url, name, { width: target.width, height: target.height }, target)
    : openPopup(url, name, tvWindowSize(window.screen.availWidth, window.screen.availHeight), currentScreenArea(), (screen - TV_DEFAULT_SCREEN) * TV_WINDOW_CASCADE_PX)
  if (opened) tvWindows.set(screen, opened)
  return opened
}

/** Closes the TV windows this tab opened ('Cerrar todas'; the others close themselves when told). */
export function closeTvWindows(): void {
  for (const win of tvWindows.values()) {
    try {
      win.close()
    } catch {
      // Already gone.
    }
  }
  tvWindows.clear()
}

/** Moves and sizes a window (a popup the app opened, or a TV window moving itself). */
export function moveWindowTo(win: Window, area: ScreenArea): void {
  try {
    win.moveTo(area.left, area.top)
    win.resizeTo(area.width, area.height)
  } catch {
    // A window the browser will not move stays where it is.
  }
}
