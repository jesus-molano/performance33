// What this device keeps for each TV window (localStorage): its A-/A+ size and the columns of older versions.

import { DISPLAY_STORAGE_KEYS } from '@/features/display/config/display'
import { removeStorage } from '@/lib/safeStorage'
import { broadcastTvScreen } from '@/persistence/channels'
import { tvFontScaleName } from './tvScreens'
import { forgetStoredSlots } from './tvSlots'

/** A removed screen: its window in this browser closes, and one added again later starts fresh (columns, A-/A+). */
export function closeTvScreen(screen: number): void {
  forgetStoredSlots(screen)
  removeStorage(`${DISPLAY_STORAGE_KEYS.fontScale}:${tvFontScaleName(screen)}`)
  broadcastTvScreen({ type: 'close', screen })
}
