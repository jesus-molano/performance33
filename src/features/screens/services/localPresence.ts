// Local test mode: TV windows of this browser say they are open over the 'p33-tv-screens' channel.

import { broadcastTvScreen, listenTvScreens } from '@/persistence/channels'
import type { ScreenPresence } from './types'

export function createLocalPresence(): ScreenPresence {
  return {
    track(screen) {
      const announce = () => broadcastTvScreen({ type: 'open', screen })
      const leave = () => broadcastTvScreen({ type: 'closed', screen })
      const stop = listenTvScreens((message) => {
        if (message.type === 'ask') announce()
      })
      announce()
      window.addEventListener('pagehide', leave)
      return () => {
        stop()
        window.removeEventListener('pagehide', leave)
        leave()
      }
    },

    watch(listener) {
      let online: ReadonlySet<number> = new Set()
      const update = (next: Set<number>) => {
        online = next
        listener(online)
      }
      const stop = listenTvScreens((message) => {
        if (message.type === 'open') update(new Set(online).add(message.screen))
        if (message.type === 'closed' || message.type === 'close') update(new Set([...online].filter((s) => s !== message.screen)))
      })
      listener(online)
      broadcastTvScreen({ type: 'ask' })
      return stop
    },
  }
}
