import { useCallback } from 'react'
import { COPY } from '@/config/copy'
import { isPhoneScreen, openTvWindow } from '@/lib/displayWindow'
import { navigate, paths } from '@/lib/routes'
import { broadcastTvControl } from '@/persistence/channels'
import { flushDashboardSaves } from '@/persistence/dashboardSync'
import { useHistoryState } from '@/store/hooks'
import { useToast } from './useToast'
import { useTvDisplays } from './useTvDisplays'

export interface DisplayWindowApi {
  /** Opens (or focuses) the popup of a named TV screen, on its TV when the browser can see it; an open one goes back to its TV. */
  openTv: (screen: number) => void
}

/**
 * Opens the TV windows (one person goes to a TV section instead, see features/screens). If the browser blocks the
 * popup, shows a toast whose 'Abrir pantalla' button retries the same window from a fresh click (which popup blockers allow).
 * On a phone there are no popups: the same tab goes to the screen page, once everything is saved (leaving the
 * dashboard stops its retries, so an edit without connection would be lost).
 */
export function useDisplayWindow(): DisplayWindowApi {
  const { toast } = useToast()
  const { canUndo } = useHistoryState()
  const { displayFor } = useTvDisplays()

  const fallback = useCallback(
    (retry: () => void) =>
      toast({
        message: COPY.popupBlocked,
        tone: 'error',
        actionLabel: COPY.openScreen,
        onAction: retry,
      }),
    [toast],
  )

  const goOnPhone = useCallback(
    (path: string) => {
      void flushDashboardSaves().then((saved) => {
        if (!saved) {
          toast({ message: COPY.screenWaitsForSave, tone: 'error' })
          return
        }
        // Coming back reloads the dashboard, so its undo history does not survive the trip.
        if (canUndo) toast({ message: COPY.undoEndsOnScreen })
        navigate(path)
      })
    },
    [canUndo, toast],
  )

  const openTv = useCallback<DisplayWindowApi['openTv']>(
    (screen) => {
      if (isPhoneScreen()) {
        goOnPhone(paths.tv(screen))
        return
      }
      const target = displayFor(screen)?.bounds ?? null
      if (!openTvWindow(screen, target)) fallback(() => openTvWindow(screen, target))
      // A window already open (brought to the laptop, or opened before this page was reloaded) goes back to its TV.
      broadcastTvControl({ type: 'place', screen })
    },
    [displayFor, fallback, goOnPhone],
  )

  return { openTv }
}
