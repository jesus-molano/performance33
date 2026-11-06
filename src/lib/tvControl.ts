// Orders from a dashboard to every TV window of this browser (BroadcastChannel 'p33-tv-control'), and where a TV
// window goes when brought to the laptop. Pure: no browser needed, so it is tested on its own.

import { TV_DEFAULT_SCREEN, TV_MAX_SCREENS, TV_TILE_GAP_PX } from '@/config/app'
import type { ScreenArea } from './screenDetails'

/**
 * close-all: every TV window closes itself · bring-all: they leave fullscreen and tile on the laptop (`screens`: the
 * windows open, so each one knows its place) · place: that screen's window goes back to its TV, fullscreen.
 */
export type TvControlMessage = { type: 'close-all' } | { type: 'bring-all'; screens: number[] } | { type: 'place'; screen: number }

const isScreenNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= TV_DEFAULT_SCREEN && value <= TV_MAX_SCREENS

/** A message off the channel, or null when it is not one of ours (another version of the app, a bad payload). */
export function parseTvControlMessage(data: unknown): TvControlMessage | null {
  if (!data || typeof data !== 'object') return null
  const message = data as Record<string, unknown>
  switch (message.type) {
    case 'close-all':
      return { type: 'close-all' }
    case 'bring-all': {
      const screens = Array.isArray(message.screens) ? message.screens.filter(isScreenNumber) : []
      return { type: 'bring-all', screens: [...new Set(screens)].sort((a, b) => a - b) }
    }
    case 'place':
      return isScreenNumber(message.screen) ? { type: 'place', screen: message.screen } : null
    default:
      return null
  }
}

/** Columns × rows that hold `count` windows, as square as possible and wider than tall (3 → 2 × 2, 5 → 3 × 2). */
export function tileGrid(count: number): { columns: number; rows: number } {
  const n = Math.max(1, count)
  const columns = Math.ceil(Math.sqrt(n))
  return { columns, rows: Math.ceil(n / columns) }
}

/**
 * Where the window of `screen` goes on the laptop: its cell in a grid of the windows open, ordered by screen number,
 * so none hides another. A screen not in the list (it opened after the order) goes after the others.
 */
export function tileArea(screen: number, screens: readonly number[], area: ScreenArea, gap = TV_TILE_GAP_PX): ScreenArea {
  const ordered = [...new Set([...screens, screen])].sort((a, b) => a - b)
  const index = ordered.indexOf(screen)
  const { columns, rows } = tileGrid(ordered.length)
  const width = Math.floor((area.width - gap * (columns - 1)) / columns)
  const height = Math.floor((area.height - gap * (rows - 1)) / rows)
  const column = index % columns
  const row = Math.floor(index / columns)
  return { left: area.left + column * (width + gap), top: area.top + row * (height + gap), width, height }
}
