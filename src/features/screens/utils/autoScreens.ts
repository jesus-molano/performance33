// One screen per TV of the gym's TV laptop: which screens to create, and which screen can be removed by hand.

import { TV_DEFAULT_SCREEN, TV_MAX_SCREENS } from '@/config/app'
import type { ScreenDetectionState } from '@/lib/screenDetails'

/** The browser sees the TVs (permission given, the screens read): screens follow them, nobody adds one by hand. */
export const followsDetectedTvs = (state: ScreenDetectionState): boolean => state === 'ok'

/**
 * TVs that no screen of the gym has (resolveTvDisplays gives free TVs to the existing screens first): `tvKeys` are the
 * TVs seen, `placedKeys` the displays the existing screens got.
 */
export function unplacedTvCount(tvKeys: readonly string[], placedKeys: readonly string[]): number {
  const placed = new Set(placedKeys)
  return new Set(tvKeys.filter((key) => !placed.has(key))).size
}

/**
 * Screens to create so every TV has one: one per TV no screen has, first the numbers chosen by hand for a TV on this
 * laptop (`preferred`), then the lowest free numbers. Never removes anything: a TV switched off leaves its screen
 * 'desconectada'. The same inputs give the same plan, so two tabs doing it at once create the same rows.
 */
export function planMissingScreens(existing: readonly number[], unplacedTvs: number, preferred: readonly number[] = []): number[] {
  const have = new Set(existing)
  const missing = Math.min(unplacedTvs, TV_MAX_SCREENS - have.size)
  if (missing <= 0) return []
  const plan: number[] = []
  const take = (screen: number) => {
    if (plan.length < missing && !have.has(screen) && !plan.includes(screen) && screen >= TV_DEFAULT_SCREEN && screen <= TV_MAX_SCREENS) plan.push(screen)
  }
  ;[...preferred].sort((a, b) => a - b).forEach(take)
  for (let screen = TV_DEFAULT_SCREEN; screen <= TV_MAX_SCREENS; screen++) take(screen)
  return plan
}

/**
 * Screens are created by themselves only on the gym's TV laptop: the one that sees the TVs and has a TV window open.
 * A coach's computer with an extra monitor never creates screens for the whole gym.
 */
export const createsScreensHere = (following: boolean, tvWindowsOpenHere: number): boolean => following && tvWindowsOpenHere > 0

/** With the TVs seen, a screen that has a TV now would come straight back: only a screen without one can go. */
export const canRemoveWithTvs = (hasTv: boolean, following: boolean): boolean => !following || !hasTv
