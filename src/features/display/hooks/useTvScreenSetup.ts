import { useEffect, useRef } from 'react'
import { paths, replaceRoute, type TvSlot } from '@/lib/routes'
import { useScreenActions, type ScreensStatus } from '@/features/screens'
import { rememberLegacyLink, wasLegacyLinkUsed } from '@/features/display/utils/legacyLinks'
import { forgetStoredSlots, loadStoredSlots } from '@/features/display/utils/tvSlots'

/**
 * Once the screens have been read, what older versions had for this screen fills it if it shows nobody: the ?slots=
 * link (once per device, so a bookmark does not bring the same people back every morning), else the setup kept on
 * this device (then forgotten). The link loses its list. A screen is never created here: a removed one stays removed.
 */
export function useTvScreenSetup(screen: number, legacySlots: TvSlot[] | null, status: ScreensStatus): void {
  const actions = useScreenActions()
  const legacy = useRef(legacySlots)
  const doneFor = useRef<number | null>(null)

  useEffect(() => {
    if (status !== 'ready' || doneFor.current === screen) return
    doneFor.current = screen
    const link = legacy.current && !wasLegacyLinkUsed(screen, legacy.current) ? legacy.current : null
    const old = link ?? loadStoredSlots(screen)
    if (old) actions.fillScreen(screen, old)
    if (link) rememberLegacyLink(screen, link)
    forgetStoredSlots(screen)
    if (legacy.current) replaceRoute(paths.tv(screen))
    legacy.current = null
  }, [status, screen, actions])
}
