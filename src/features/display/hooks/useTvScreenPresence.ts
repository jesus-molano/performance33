import { useEffect } from 'react'
import { listenTvScreens } from '@/persistence/channels'

/** A TV window closes itself when its screen is removed in this browser (Ajustes → Pantallas, the 'Pantallas' menu). */
export function useTvScreenPresence(screen: number): void {
  useEffect(
    () =>
      listenTvScreens((message) => {
        if (message.type === 'close' && message.screen === screen) window.close()
      }),
    [screen],
  )
}
