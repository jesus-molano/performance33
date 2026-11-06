import { useCallback, useEffect, useRef, useState } from 'react'
import { TV_CLOSE_CHECK_MS, TV_MOVE_AFTER_EXIT_MS } from '@/config/app'
import { moveWindowTo } from '@/lib/displayWindow'
import type { ScreenArea } from '@/lib/screenDetails'
import { tileArea, type TvControlMessage } from '@/lib/tvControl'
import { listenTvControl } from '@/persistence/channels'
import type { TvAutoFullscreen } from './useTvAutoFullscreen'

export interface TvWindowControlOptions {
  screen: number
  /** The whole TV of this screen, when it has one now. */
  tvBounds: ScreenArea | null
  /** Where windows go on the laptop (its main screen without the taskbar). */
  laptopArea: ScreenArea | null
  auto: TvAutoFullscreen
  exitFullscreen: () => Promise<void>
  /** Put back on its TV and the browser needs a click for fullscreen: offer it again. */
  onPlacedNeedsClick: () => void
  autoAllowed: boolean
}

export interface TvWindowControl {
  /** 'Cerrar todas' reached a window the app did not open: the browser will not let it close itself. */
  closeBlocked: boolean
  dismissCloseBlocked: () => void
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

/** This screen, when the main screen is unknown: from the top left corner of the desktop, which is the laptop's. */
const fallbackLaptopArea = (): ScreenArea => ({ left: 0, top: 0, width: window.screen.availWidth, height: window.screen.availHeight })

/**
 * A TV window follows the orders of the dashboards of this browser ('Traer todas', 'Cerrar todas', 'Abrir' on a
 * window already open), over BroadcastChannel, so they work even after the dashboard was reloaded.
 */
export function useTvWindowControl(options: TvWindowControlOptions): TvWindowControl {
  const [closeBlocked, setCloseBlocked] = useState(false)
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  const handle = useCallback(async (message: TvControlMessage) => {
    const { screen, tvBounds, laptopArea, auto, exitFullscreen, onPlacedNeedsClick, autoAllowed } = latest.current
    switch (message.type) {
      case 'close-all':
        window.close()
        // Still here: a window the app did not open (typed address, restored tab) cannot close itself.
        await wait(TV_CLOSE_CHECK_MS)
        auto.hold()
        await exitFullscreen()
        setCloseBlocked(true)
        return
      case 'bring-all':
        auto.hold()
        await exitFullscreen()
        await wait(TV_MOVE_AFTER_EXIT_MS)
        moveWindowTo(window, tileArea(screen, message.screens, laptopArea ?? fallbackLaptopArea()))
        return
      case 'place':
        if (message.screen !== screen) return
        setCloseBlocked(false)
        if (!document.fullscreenElement && tvBounds) moveWindowTo(window, tvBounds)
        auto.release()
        if (!autoAllowed && !document.fullscreenElement) onPlacedNeedsClick()
    }
  }, [])

  useEffect(() => listenTvControl((message) => void handle(message)), [handle])

  return { closeBlocked, dismissCloseBlocked: () => setCloseBlocked(false) }
}
