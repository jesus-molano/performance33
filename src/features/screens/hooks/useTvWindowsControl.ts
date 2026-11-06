import { useCallback } from 'react'
import { useDisplayWindow, useToast } from '@/hooks'
import { closeTvWindows } from '@/lib/displayWindow'
import { broadcastTvControl } from '@/persistence/channels'
import { TV_WINDOWS_COPY } from '@/features/screens/config/tvWindows'
import { useBrowserScreenPresence } from './useScreenPresence'

export interface TvWindowsControl {
  /** At least one TV window is open in this browser: the buttons make sense. */
  visible: boolean
  /** Every TV window leaves fullscreen and comes to the laptop, side by side. */
  bringAll: () => void
  /** Every TV window closes ('Abrir otra vez' in the toast opens them again, one per click). */
  closeAll: () => void
}

/**
 * 'Traer al portátil' and 'Cerrar todas' (Pantallas menu, Ajustes → Pantallas): orders over BroadcastChannel to every TV
 * window of this browser, so they also reach windows this page did not open (it was reloaded). A click opens one popup
 * only, so the windows closed come back one per click: each toast opens one and offers the next.
 */
export function useTvWindowsControl(): TvWindowsControl {
  const openHere = useBrowserScreenPresence()
  const { toast } = useToast()
  const { openTv } = useDisplayWindow()

  const bringAll = useCallback(() => {
    const screens = [...openHere].sort((a, b) => a - b)
    broadcastTvControl({ type: 'bring-all', screens })
    toast({
      message: TV_WINDOWS_COPY.broughtToast,
      actionLabel: TV_WINDOWS_COPY.sendBack,
      onAction: () => screens.forEach((screen) => broadcastTvControl({ type: 'place', screen })),
    })
  }, [openHere, toast])

  const offerReopen = useCallback(
    (screens: readonly number[]) => {
      const offer = (message: string, [next, ...rest]: readonly number[]) => {
        if (next === undefined) return
        toast({
          message,
          actionLabel: screens.length === 1 ? TV_WINDOWS_COPY.reopen : TV_WINDOWS_COPY.reopenOne(next),
          onAction: () => {
            openTv(next)
            offer(TV_WINDOWS_COPY.reopenPending(rest.length), rest)
          },
        })
      }
      offer(TV_WINDOWS_COPY.closedToast, screens)
    },
    [openTv, toast],
  )

  const closeAll = useCallback(() => {
    const screens = [...openHere].sort((a, b) => a - b)
    broadcastTvControl({ type: 'close-all' })
    closeTvWindows()
    offerReopen(screens)
  }, [offerReopen, openHere])

  return { visible: openHere.size > 0, bringAll, closeAll }
}
