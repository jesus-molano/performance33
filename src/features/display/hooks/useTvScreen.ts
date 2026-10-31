import { useMemo } from 'react'
import { getDisplayableClients } from '@/lib/display'
import type { TvSlot } from '@/lib/routes'
import { useDisplayShortcuts } from './useDisplayShortcuts'
import { useScreenChrome } from './useScreenChrome'
import { useScreenData } from './useScreenData'
import { useTvSlots } from './useTvSlots'

/** Modo TV window: live data, clients with a routine, slot/column setters and window chrome. */
export function useTvScreen(slots: TvSlot[]) {
  const screen = useScreenData()
  const chrome = useScreenChrome('tv')
  const clients = useMemo(() => (screen.data ? getDisplayableClients(screen.data) : []), [screen.data])
  const clientIds = useMemo(() => clients.map((c) => c.id), [clients])
  const slotsApi = useTvSlots(slots, clientIds)

  useDisplayShortcuts({
    fullscreen: chrome.toggleFullscreen,
    bigger: chrome.increase,
    smaller: chrome.decrease,
  })

  return { ...screen, ...slotsApi, chrome, hasClients: clients.length > 0 }
}
