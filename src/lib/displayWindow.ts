// window.open helpers for the Pantalla (one client) and Modo TV (3 columns) windows.
// MUST be called synchronously inside a click handler, otherwise popup blockers kick in.

import { DISPLAY_WINDOW_SIZE, POPUP_SCREEN_MARGIN, TV_WINDOW_SIZE } from '@/config/app'
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

/** Opens (or focuses) a named popup. Returns null when the browser blocked it. */
export function openPopup(url: string, name: string, size: WindowSize): Window | null {
  const left = Math.max(0, (window.screen.availWidth - size.width) / 2)
  const top = Math.max(0, (window.screen.availHeight - size.height) / 2)
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

export function tvWindowUrl(slots: TvSlot[] = []): string {
  return absoluteHashUrl(paths.tv(slots))
}

/** Single-client display: tall narrow column ≈ a third of a 16:9 TV. One window per client. */
export function openDisplayWindow(clientId: string, day?: number | null, programId?: string | null): Window | null {
  const size = displayWindowSize(window.screen.availHeight)
  return openPopup(displayWindowUrl(clientId, day, programId), `p33-pantalla-${clientId}`, size)
}

let tvWindow: Window | null = null

/** 3-column TV window (16:9). If this tab already opened it, it is focused, not reloaded. */
export function openTvWindow(slots: TvSlot[] = []): Window | null {
  if (tvWindow && !tvWindow.closed) {
    tvWindow.focus()
    return tvWindow
  }
  tvWindow = openPopup(tvWindowUrl(slots), 'p33-tv', tvWindowSize(window.screen.availWidth, window.screen.availHeight))
  return tvWindow
}
