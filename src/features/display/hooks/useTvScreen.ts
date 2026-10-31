import { useMemo } from 'react'
import { getDisplayableClients } from '../../../lib/display'
import type { TvSlot } from '../../../lib/routes'
import { useDisplayShortcuts } from './useDisplayShortcuts'
import { useScreenChrome } from './useScreenChrome'
import { useScreenData } from './useScreenData'
import { useTvSlots } from './useTvSlots'

/** Modo TV window: live data, the clients that can be picked, slot setters and window chrome. */
export function useTvScreen(slots: TvSlot[]) {
  const screen = useScreenData()
  const chrome = useScreenChrome('tv')
  const slotsApi = useTvSlots(slots)
  const clients = useMemo(() => (screen.data ? getDisplayableClients(screen.data) : []), [screen.data])

  useDisplayShortcuts({
    fullscreen: chrome.toggleFullscreen,
    bigger: chrome.increase,
    smaller: chrome.decrease,
  })

  return { ...screen, ...slotsApi, chrome, clients }
}
