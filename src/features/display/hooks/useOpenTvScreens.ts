import { useEffect, useState } from 'react'
import { broadcastTvScreen, listenTvScreens } from '@/persistence/channels'

/** Screens whose window is open right now in this browser (asked when the hook mounts, then followed). */
export function useOpenTvScreens(): ReadonlySet<number> {
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set())

  useEffect(() => {
    const stop = listenTvScreens((message) => {
      if (message.type === 'open') setOpen((current) => new Set(current).add(message.screen))
      if (message.type === 'closed' || message.type === 'close') {
        setOpen((current) => new Set([...current].filter((screen) => screen !== message.screen)))
      }
    })
    broadcastTvScreen({ type: 'ask' })
    return stop
  }, [])

  return open
}
