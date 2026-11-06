import { useCallback, useEffect, useState } from 'react'
import type { ScreenLike } from '@/lib/screenDetails'

export interface FullscreenApi {
  isFullscreen: boolean
  toggleFullscreen: () => void
}

/** Fullscreen; with a target screen (the TV detected for this window) it goes fullscreen on that TV, wherever the window is. */
export function useFullscreen(target: ScreenLike | null = null): FullscreenApi {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement))

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const options: FullscreenOptions & { screen?: ScreenLike } = target ? { screen: target } : {}
    const request = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(options)
    request.catch(() => undefined)
  }, [target])

  return { isFullscreen, toggleFullscreen }
}
