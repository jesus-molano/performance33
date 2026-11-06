// One screen per TV this laptop sees: which screens to create, and when adding or removing one by hand makes sense.

import { TV_DEFAULT_SCREEN, TV_MAX_SCREENS } from '@/config/app'
import type { ScreenDetectionState } from '@/lib/screenDetails'

/** The browser sees the TVs (permission given, the screens read): screens follow them, nobody adds one by hand. */
export const followsDetectedTvs = (state: ScreenDetectionState): boolean => state === 'ok'

/**
 * Screens to create so every TV has one: as many as TVs beyond the screens the gym has, first those a TV is already
 * given to on this laptop (`assigned`), then the lowest free numbers. Never removes anything: a TV switched off leaves
 * its screen 'desconectada'. The same inputs give the same plan, so two tabs doing it at once create the same rows.
 */
export function planMissingScreens(existing: readonly number[], tvCount: number, assigned: readonly number[] = []): number[] {
  const have = new Set(existing)
  const missing = Math.min(tvCount, TV_MAX_SCREENS) - have.size
  if (missing <= 0) return []
  const plan: number[] = []
  const take = (screen: number) => {
    if (plan.length < missing && !have.has(screen) && !plan.includes(screen) && screen >= TV_DEFAULT_SCREEN && screen <= TV_MAX_SCREENS) plan.push(screen)
  }
  ;[...assigned].sort((a, b) => a - b).forEach(take)
  for (let screen = TV_DEFAULT_SCREEN; screen <= TV_MAX_SCREENS; screen++) take(screen)
  return plan
}

/** With the TVs seen, a screen whose TV is connected would come straight back: only the extra ones can go. */
export const canRemoveWithTvs = (screenCount: number, tvCount: number, following: boolean): boolean =>
  !following || screenCount > tvCount
