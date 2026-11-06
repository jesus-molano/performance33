// What this window knows of the screens. A store of its own, outside the routine data: never in undo, never in backups.

import { create } from 'zustand'
import { SCREENS_ECHO_WINDOW_MS } from '@/config/app'
import type { ScreensStatus } from '@/features/screens/types'
import { createPendingWrites } from '@/features/screens/utils/pendingWrites'
import type { ScreensData } from '@/features/screens/utils/snapshot'

export interface ScreensState extends ScreensData {
  status: ScreensStatus
  /** Screens whose TV window is open somewhere. */
  online: ReadonlySet<number>
}

export const useScreensStore = create<ScreensState>()(() => ({ status: 'idle', screens: [], sections: {}, online: new Set() }))

/** Writes of this window the server has not sent back yet. */
export const pendingWrites = createPendingWrites(SCREENS_ECHO_WINDOW_MS)
