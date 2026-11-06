import { useEffect, useRef } from 'react'
import { SCREEN_DETECTION_COPY } from '@/config/screenDetection'
import { useToast, useTvDisplays } from '@/hooks'
import { lostTvScreens } from '@/lib/tvDisplays'
import { useScreens } from '@/features/screens'

/** 'Pantalla 2 desconectada': says so when the TV of an open screen goes away (Win+K dropped, TV switched off). */
export function useTvDisconnectAlert(): void {
  const { detection, displayFor } = useTvDisplays()
  const { screens } = useScreens()
  const { toast } = useToast()
  const placed = useRef<ReadonlyMap<number, string>>(new Map())

  useEffect(() => {
    const now = new Map(
      screens.flatMap((screen) => {
        const display = screen.online ? displayFor(screen.id) : null
        return display ? [[screen.id, display.key] as const] : []
      }),
    )
    // A window that closes is not a lost TV; one still open whose TV went away is. Before the screens are read
    // (permission pending) nothing can be told.
    if (detection.state === 'ok' || detection.state === 'single') {
      for (const id of lostTvScreens(placed.current, now)) {
        const screen = screens.find((s) => s.id === id)
        if (screen?.online) toast({ message: SCREEN_DETECTION_COPY.disconnectedToast(screen.name), tone: 'error' })
      }
    }
    placed.current = now
  }, [detection.state, displayFor, screens, toast])
}
