import { useCallback, useEffect, useState } from 'react'

export interface FullscreenApi {
  isFullscreen: boolean
  toggleFullscreen: () => void
}

export function useFullscreen(): FullscreenApi {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement))

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen()
    request.catch(() => undefined)
  }, [])

  return { isFullscreen, toggleFullscreen }
}
