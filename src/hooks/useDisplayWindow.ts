import { useCallback } from 'react'
import { COPY } from '@/config/copy'
import { isPhoneScreen, openDisplayWindow, openTvWindow } from '@/lib/displayWindow'
import { navigate, paths, type TvSlot } from '@/lib/routes'
import { flushDashboardSaves } from '@/persistence/dashboardSync'
import { useHistoryState } from '@/store/hooks'
import { useToast } from './useToast'

export interface DisplayWindowApi {
  /** Opens a client's Pantalla popup. Call directly inside a click handler. */
  openDisplay: (clientId: string, day?: number | null, programId?: string | null) => void
  /** Opens the popup of a named TV screen (1-4 columns). */
  openTv: (screen: number, slots?: TvSlot[]) => void
}

/**
 * Opens display windows. If the browser blocks the popup, shows a toast whose 'Abrir pantalla'
 * button retries the same window from a fresh click (which popup blockers allow).
 * On a phone there are no popups: the same tab goes to the screen page, once everything is saved (leaving the
 * dashboard stops its retries, so an edit without connection would be lost).
 */
export function useDisplayWindow(): DisplayWindowApi {
  const { toast } = useToast()
  const { canUndo } = useHistoryState()

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

  const openDisplay = useCallback<DisplayWindowApi['openDisplay']>(
    (clientId, day, programId) => {
      if (isPhoneScreen()) goOnPhone(paths.display(clientId, day ?? null, programId ?? null))
      else if (!openDisplayWindow(clientId, day, programId)) fallback(() => openDisplayWindow(clientId, day, programId))
    },
    [fallback, goOnPhone],
  )

  const openTv = useCallback<DisplayWindowApi['openTv']>(
    (screen, slots = []) => {
      if (isPhoneScreen()) goOnPhone(paths.tv())
      else if (!openTvWindow(screen, slots)) fallback(() => openTvWindow(screen, slots))
    },
    [fallback, goOnPhone],
  )

  return { openDisplay, openTv }
}
