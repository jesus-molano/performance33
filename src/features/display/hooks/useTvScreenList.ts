import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { broadcastTvScreen } from '@/persistence/channels'
import { forgetTvScreen, readTvScreensRaw, saveTvScreens, subscribeTvScreens } from '@/features/display/utils/tvScreenStore'
import { canAddTvScreen, canRemoveTvScreen, includeTvScreen, nextTvScreen, parseTvScreens, removeTvScreen } from '@/features/display/utils/tvScreens'

export interface TvScreenList {
  screens: number[]
  canAdd: boolean
  canRemove: boolean
  /** Adds the next free screen and returns its number, or null at the maximum. */
  add: () => number | null
  /** Closes its window, if open, and forgets its columns and text size. */
  remove: (screen: number) => void
}

/** The named screens of this device, kept live across windows. */
export function useTvScreenList(): TvScreenList {
  const raw = useSyncExternalStore(subscribeTvScreens, readTvScreensRaw)
  const screens = useMemo(() => parseTvScreens(raw), [raw])

  const add = useCallback(() => {
    const next = nextTvScreen(screens)
    if (next !== null) saveTvScreens(includeTvScreen(screens, next))
    return next
  }, [screens])

  const remove = useCallback(
    (screen: number) => {
      saveTvScreens(removeTvScreen(screens, screen))
      forgetTvScreen(screen)
      broadcastTvScreen({ type: 'close', screen })
    },
    [screens],
  )

  return { screens, canAdd: canAddTvScreen(screens), canRemove: canRemoveTvScreen(screens), add, remove }
}
