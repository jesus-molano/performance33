import { useEffect, useRef } from 'react'
import { paths, replaceRoute, type TvSlot } from '@/lib/routes'
import { useScreenActions, type ScreensStatus } from '@/features/screens'
import { forgetStoredSlots, loadStoredSlots } from '@/features/display/utils/tvSlots'

/**
 * Once the screens have been read: the screen exists for the whole gym, and what older versions had for it (the
 * ?slots= link, else the setup kept on this device) fills it if it shows nobody. Then the link loses its list.
 */
export function useTvScreenSetup(screen: number, legacySlots: TvSlot[] | null, status: ScreensStatus): void {
  const actions = useScreenActions()
  const legacy = useRef(legacySlots)
  const doneFor = useRef<number | null>(null)

  useEffect(() => {
    if (status !== 'ready' || doneFor.current === screen) return
    doneFor.current = screen
    const old = legacy.current ?? loadStoredSlots(screen)
    if (old) actions.fillScreen(screen, old)
    void actions.ensureScreen(screen)
    forgetStoredSlots(screen)
    if (legacy.current) replaceRoute(paths.tv(screen))
    legacy.current = null
  }, [status, screen, actions])
}
