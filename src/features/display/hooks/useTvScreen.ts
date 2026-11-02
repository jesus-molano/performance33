import { useMemo } from 'react'
import { getDisplayableClients } from '@/lib/display'
import type { TvSlot } from '@/lib/routes'
import { tvFontScaleName, tvScreenTitle } from '@/features/display/utils/tvScreens'
import { useDisplayShortcuts } from './useDisplayShortcuts'
import { useScreenChrome } from './useScreenChrome'
import { useScreenData } from './useScreenData'
import { useTvScreenPresence } from './useTvScreenPresence'
import { useTvSlots } from './useTvSlots'

/** Modo TV window (one named screen): live data, clients with a routine, slot/column setters and window chrome. */
export function useTvScreen(screenNumber: number, slots: TvSlot[]) {
  const title = tvScreenTitle(screenNumber)
  const screen = useScreenData(title)
  const chrome = useScreenChrome(tvFontScaleName(screenNumber))
  const clients = useMemo(() => (screen.data ? getDisplayableClients(screen.data) : []), [screen.data])
  const clientIds = useMemo(() => clients.map((c) => c.id), [clients])
  const slotsApi = useTvSlots(screenNumber, slots, clientIds)
  useTvScreenPresence(screenNumber)

  useDisplayShortcuts({
    fullscreen: chrome.toggleFullscreen,
    bigger: chrome.increase,
    smaller: chrome.decrease,
  })

  return { ...screen, ...slotsApi, title, chrome, hasClients: clients.length > 0 }
}
