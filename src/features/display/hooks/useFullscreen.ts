import { useCallback, useEffect, useState } from 'react'
import type { ScreenLike } from '@/lib/screenDetails'

export interface FullscreenApi {
  isFullscreen: boolean
  toggleFullscreen: () => void
  /** Goes fullscreen (on the target screen when known); false when the browser refused. */
  enterFullscreen: () => Promise<boolean>
  exitFullscreen: () => Promise<void>
}

/** Fullscreen; with a target screen (the TV detected for this window) it goes fullscreen on that TV, wherever the window is. */
export function useFullscreen(target: ScreenLike | null = null): FullscreenApi {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement))

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const enterFullscreen = useCallback(async () => {
    if (document.fullscreenElement) return true
    const options: FullscreenOptions & { screen?: ScreenLike } = target ? { screen: target } : {}
    try {
      await document.documentElement.requestFullscreen(options)
      return true
    } catch {
      return false
    }
  }, [target])

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined)
  }, [])

  const toggleFullscreen = useCallback(() => {
    void (document.fullscreenElement ? exitFullscreen() : enterFullscreen())
  }, [enterFullscreen, exitFullscreen])

  return { isFullscreen, toggleFullscreen, enterFullscreen, exitFullscreen }
}
