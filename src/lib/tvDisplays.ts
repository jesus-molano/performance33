// Which detected screen each Pantalla N opens on. Choices are kept per computer; without one, the TVs (every screen
// but the main one) go to Pantalla 1, 2… from left to right.

import { TV_DEFAULT_SCREEN, TV_MAX_SCREENS } from '@/config/app'
import type { DetectedDisplay } from './screenDetails'

/** Pantalla number → key of the screen chosen for it on this computer. */
export type TvDisplayMap = Readonly<Record<number, string>>

const isScreenNumber = (value: number): boolean => Number.isInteger(value) && value >= TV_DEFAULT_SCREEN && value <= TV_MAX_SCREENS

export function parseTvDisplayMap(raw: string | null): TvDisplayMap {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const map: Record<number, string> = {}
    for (const [screen, key] of Object.entries(parsed)) {
      if (isScreenNumber(Number(screen)) && typeof key === 'string' && key) map[Number(screen)] = key
    }
    return map
  } catch {
    return {}
  }
}

export const serializeTvDisplayMap = (map: TvDisplayMap): string => JSON.stringify(map)

/** Chooses a screen for one Pantalla (null: back to automatic). A screen belongs to one Pantalla only. */
export function assignTvDisplay(map: TvDisplayMap, screen: number, key: string | null): TvDisplayMap {
  const next: Record<number, string> = {}
  for (const [other, otherKey] of Object.entries(map)) {
    if (Number(other) !== screen && otherKey !== key) next[Number(other)] = otherKey
  }
  if (key) next[screen] = key
  return next
}

/** Screens a TV window goes to by default: all but the main one, left to right. */
export function tvCandidates(displays: readonly DetectedDisplay[]): DetectedDisplay[] {
  return displays.filter((display) => !display.isPrimary).sort((a, b) => a.area.left - b.area.left || a.area.top - b.area.top)
}

/**
 * Screen of every Pantalla that has one now. A Pantalla whose chosen screen is not connected gets none (it is
 * 'desconectada'), instead of taking another TV's place.
 */
export function resolveTvDisplays(map: TvDisplayMap, displays: readonly DetectedDisplay[]): ReadonlyMap<number, DetectedDisplay> {
  const result = new Map<number, DetectedDisplay>()
  const used = new Set<string>()
  for (const [screen, key] of Object.entries(map)) {
    const display = displays.find((d) => d.key === key)
    if (display) {
      result.set(Number(screen), display)
      used.add(key)
    }
  }
  const free = tvCandidates(displays).filter((display) => !used.has(display.key))
  for (let screen = TV_DEFAULT_SCREEN; screen <= TV_MAX_SCREENS; screen++) {
    const next = map[screen] === undefined ? free.shift() : undefined
    if (next) result.set(screen, next)
  }
  return result
}

/** Pantallas that had a TV before and have none now (Pantalla number → key of its screen, before and after). */
export function lostTvScreens(before: ReadonlyMap<number, string>, after: ReadonlyMap<number, string>): number[] {
  return [...before.keys()].filter((screen) => !after.has(screen))
}
