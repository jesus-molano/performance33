import { useCallback, useEffect, useRef, useState } from 'react'
import { TV_CLOSE_CHECK_MS, TV_MOVE_AFTER_EXIT_MS, TV_WINDOW_SIZE } from '@/config/app'
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
  /** 'Seguir mostrándola': the window stays, back on its TV and fullscreen like after 'Colocar'. */
  dismissCloseBlocked: () => void
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

/**
 * The laptop's size is unknown (the screens cannot be seen). This window may be on a TV, whose size says nothing about
 * the laptop, so the windows share a usual window size from the top left corner, never more than this screen.
 */
const fallbackLaptopArea = (): ScreenArea => ({
  left: 0,
  top: 0,
  width: Math.min(TV_WINDOW_SIZE.width, window.screen.availWidth),
  height: Math.min(TV_WINDOW_SIZE.height, window.screen.availHeight),
})

/**
 * A TV window follows the orders of the dashboards of this browser ('Traer al portátil', 'Cerrar todas', 'Abrir' on a
 * window already open), over BroadcastChannel, so they work even after the dashboard was reloaded.
 */
export function useTvWindowControl(options: TvWindowControlOptions): TvWindowControl {
  const [closeBlocked, setCloseBlocked] = useState(false)
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  /** Back on its TV, fullscreen by itself where the browser allows it, else the 'Pantalla completa' bar again. */
  const putBack = useCallback(() => {
    const { tvBounds, auto, onPlacedNeedsClick, autoAllowed } = latest.current
    setCloseBlocked(false)
    if (!document.fullscreenElement && tvBounds) moveWindowTo(window, tvBounds)
    auto.release()
    if (!autoAllowed && !document.fullscreenElement) onPlacedNeedsClick()
  }, [])

  const handle = useCallback(
    async (message: TvControlMessage) => {
      const { screen, laptopArea, auto, exitFullscreen } = latest.current
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
          if (message.screen === screen) putBack()
      }
    },
    [putBack],
  )

  useEffect(() => listenTvControl((message) => void handle(message)), [handle])

  return { closeBlocked, dismissCloseBlocked: putBack }
}
