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
  /** Every TV window closes ('Abrir otra vez' in the toast opens them again). */
  closeAll: () => void
}

/**
 * 'Traer todas' and 'Cerrar todas' (Pantallas menu, Ajustes → Pantallas): orders over BroadcastChannel to every TV
 * window of this browser, so they also reach windows this page did not open (it was reloaded).
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

  const closeAll = useCallback(() => {
    const screens = [...openHere].sort((a, b) => a - b)
    broadcastTvControl({ type: 'close-all' })
    closeTvWindows()
    toast({ message: TV_WINDOWS_COPY.closedToast, actionLabel: TV_WINDOWS_COPY.reopen, onAction: () => screens.forEach(openTv) })
  }, [openHere, openTv, toast])

  return { visible: openHere.size > 0, bringAll, closeAll }
}
