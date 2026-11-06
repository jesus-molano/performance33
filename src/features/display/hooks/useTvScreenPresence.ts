import { useEffect } from 'react'
import { listenTvScreens } from '@/persistence/channels'
import { ensureTvScreenListed } from '@/features/display/utils/tvScreenStore'

/** A TV window lists itself in this device's 'Pantallas' menu and closes when its screen is removed from it. */
export function useTvScreenPresence(screen: number): void {
  useEffect(() => {
    ensureTvScreenListed(screen)
    return listenTvScreens((message) => {
      if (message.type === 'close' && message.screen === screen) window.close()
    })
  }, [screen])
}
