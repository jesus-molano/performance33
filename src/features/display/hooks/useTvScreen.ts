import { useMemo } from 'react'
import { useTvDisplays } from '@/hooks'
import { getDisplayableClients } from '@/lib/display'
import type { TvSlot } from '@/lib/routes'
import { useScreenSections, useTrackScreenPresence } from '@/features/screens'
import { tvFontScaleName } from '@/features/display/utils/tvScreens'
import { useDisplayShortcuts } from './useDisplayShortcuts'
import { useFullscreenPrompt } from './useFullscreenPrompt'
import { useScreenChrome } from './useScreenChrome'
import { useScreenData } from './useScreenData'
import { useTvScreenPresence } from './useTvScreenPresence'
import { useTvSlots } from './useTvSlots'
import { useWakeLock } from './useWakeLock'

/**
 * Modo TV window (one named screen): live data, its sections as saved for the gym, their setters and the window
 * chrome. It says it is open (coaches see which TVs are on) and keeps the computer from putting the screen to sleep.
 * Where the browser sees the TVs, fullscreen goes to the TV chosen for this screen and a big button offers it at the
 * start; elsewhere the old guide (drag it to the TV) stays.
 */
export function useTvScreen(screenNumber: number, legacySlots: TvSlot[] | null) {
  const title = useScreenSections(screenNumber).config.name
  const screen = useScreenData(title)
  const tvDisplays = useTvDisplays()
  const chrome = useScreenChrome(tvFontScaleName(screenNumber), tvDisplays.displayFor(screenNumber)?.source ?? null)
  const canPlace = tvDisplays.detection.state !== 'unsupported'
  const fullscreenPrompt = useFullscreenPrompt(chrome.isFullscreen, canPlace)
  const clients = useMemo(() => (screen.data ? getDisplayableClients(screen.data) : []), [screen.data])
  const clientIds = useMemo(() => clients.map((c) => c.id), [clients])
  const slotsApi = useTvSlots(screenNumber, legacySlots, clientIds)
  useTvScreenPresence(screenNumber)
  useTrackScreenPresence(screenNumber)
  useWakeLock()

  useDisplayShortcuts({
    fullscreen: chrome.toggleFullscreen,
    bigger: chrome.increase,
    smaller: chrome.decrease,
  })

  return { ...screen, ...slotsApi, title, chrome, canPlace, fullscreenPrompt, hasClients: clients.length > 0 }
}
