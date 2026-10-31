// window.open helpers for the Pantalla (one client) and Modo TV (3 columns) windows.
// MUST be called synchronously inside a click handler, otherwise popup blockers kick in.

import { DISPLAY_WINDOW_SIZE, TV_WINDOW_SIZE } from '../config/app'
import { absoluteHashUrl, paths, type TvSlot } from './routes'

interface WindowSize {
  width: number
  height: number
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
  return openPopup(displayWindowUrl(clientId, day, programId), `p33-pantalla-${clientId}`, DISPLAY_WINDOW_SIZE)
}

/** 3-column TV window (16:9). */
export function openTvWindow(slots: TvSlot[] = []): Window | null {
  return openPopup(tvWindowUrl(slots), 'p33-tv', TV_WINDOW_SIZE)
}
