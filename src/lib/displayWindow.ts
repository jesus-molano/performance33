// window.open helpers for the Pantalla (one client) and Modo TV (named screens, 1-4 columns each) windows.
// MUST be called synchronously inside a click handler, otherwise popup blockers kick in.

import { DISPLAY_WINDOW_SIZE, PHONE_SCREEN_QUERY, POPUP_SCREEN_MARGIN, SCREEN_WINDOW_NAMES, TV_DEFAULT_SCREEN, TV_WINDOW_CASCADE_PX, TV_WINDOW_SIZE } from '@/config/app'
import { absoluteHashUrl, paths, type TvSlot } from './routes'

interface WindowSize {
  width: number
  height: number
}

/** Pantalla: as tall as the screen allows (max 1080) with the 16:27 ratio of a TV third. */
export function displayWindowSize(availHeight: number): WindowSize {
  const height = Math.min(DISPLAY_WINDOW_SIZE.height, availHeight - POPUP_SCREEN_MARGIN)
  return { height, width: Math.round((height * 16) / 27) }
}

/** Modo TV: as wide as the screen allows (max 1600) with a 16:9 ratio. */
export function tvWindowSize(availWidth: number, availHeight: number): WindowSize {
  const width = Math.min(TV_WINDOW_SIZE.width, availWidth - POPUP_SCREEN_MARGIN, ((availHeight - POPUP_SCREEN_MARGIN) * 16) / 9)
  return { width: Math.round(width), height: Math.round((width * 9) / 16) }
}

/** Each named screen has its own window, so opening one never touches another. */
export const tvWindowName = (screen: number): string => `${SCREEN_WINDOW_NAMES.tv}${screen}`

const displayWindowName = (clientId: string): string => `${SCREEN_WINDOW_NAMES.display}${clientId}`

/** This window was opened as a TV window from a computer (a phone never opens popups, see isPhoneScreen). */
export function isScreenPopup(windowName: string): boolean {
  return Object.values(SCREEN_WINDOW_NAMES).some((prefix) => windowName.startsWith(prefix))
}

/** A phone: screens open in this same tab, as normal pages. Read it inside the click handler. */
export function isPhoneScreen(): boolean {
  return window.matchMedia(PHONE_SCREEN_QUERY).matches && !isScreenPopup(window.name)
}

/** Opens (or focuses) a named popup. Returns null when the browser blocked it. */
export function openPopup(url: string, name: string, size: WindowSize, cascade = 0): Window | null {
  const left = Math.max(0, (window.screen.availWidth - size.width) / 2 + cascade)
  const top = Math.max(0, (window.screen.availHeight - size.height) / 2 + cascade)
  const features = `popup=yes,width=${size.width},height=${size.height},left=${left},top=${top}`
  try {
    const win = window.open(url, name, features)
    win?.focus()
    return win
  } catch {
    return null
  }
}

/** URL of the single-client display (use as fallback link href when the popup is blocked). */
export function displayWindowUrl(clientId: string, day?: number | null, programId?: string | null): string {
  return absoluteHashUrl(paths.display(clientId, day ?? null, programId ?? null))
}

export function tvWindowUrl(screen: number, slots: TvSlot[] = []): string {
  return absoluteHashUrl(paths.tv(slots, screen))
}

/** Single-client display: tall narrow column ≈ a third of a 16:9 TV. One window per client. */
export function openDisplayWindow(clientId: string, day?: number | null, programId?: string | null): Window | null {
  const size = displayWindowSize(window.screen.availHeight)
  return openPopup(displayWindowUrl(clientId, day, programId), displayWindowName(clientId), size)
}

const tvWindows = new Map<number, Window>()

/** Window of a named screen (16:9, 1-4 columns). If this tab already opened it, it is focused, not reloaded. */
export function openTvWindow(screen: number, slots: TvSlot[] = []): Window | null {
  const current = tvWindows.get(screen)
  if (current && !current.closed) {
    current.focus()
    return current
  }
  const size = tvWindowSize(window.screen.availWidth, window.screen.availHeight)
  const opened = openPopup(tvWindowUrl(screen, slots), tvWindowName(screen), size, (screen - TV_DEFAULT_SCREEN) * TV_WINDOW_CASCADE_PX)
  if (opened) tvWindows.set(screen, opened)
  return opened
}
