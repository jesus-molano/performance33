import { useEffect } from 'react'
import { broadcastTvScreen, listenTvScreens } from '@/persistence/channels'
import { ensureTvScreenListed } from '@/features/display/utils/tvScreenStore'

/** A TV window lists itself, tells the 'Pantallas' menu it is open and closes when its screen is removed. */
export function useTvScreenPresence(screen: number): void {
  useEffect(() => {
    ensureTvScreenListed(screen)
    const announce = () => broadcastTvScreen({ type: 'open', screen })
    const onPageHide = () => broadcastTvScreen({ type: 'closed', screen })
    const stop = listenTvScreens((message) => {
      if (message.type === 'ask') announce()
      if (message.type === 'close' && message.screen === screen) window.close()
    })
    announce()
    window.addEventListener('pagehide', onPageHide)
    return () => {
      stop()
      window.removeEventListener('pagehide', onPageHide)
      onPageHide()
    }
  }, [screen])
}
