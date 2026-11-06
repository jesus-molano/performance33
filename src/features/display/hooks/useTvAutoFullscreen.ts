import { useCallback, useEffect, useRef, useState } from 'react'

export interface TvAutoFullscreenOptions {
  /** The browser allows fullscreen without a click (Chrome policy) and this screen has its TV. */
  allowed: boolean
  enter: () => Promise<boolean>
}

export interface TvAutoFullscreen {
  /** It tried and the browser said no: the 'Pantalla completa' bar is the way. */
  failed: boolean
  /** Stops going fullscreen by itself (brought to the laptop); call before leaving fullscreen. */
  hold: () => void
  /** Back on its TV: fullscreen again by itself. */
  release: () => void
}

/**
 * A TV window goes fullscreen by itself, on its TV, when the browser allows it without a click: when it opens and
 * whenever it lost it without anybody asking (TV back after Win+K, back on the network, the window visible or focused
 * again, moved to another screen). A coach who leaves fullscreen in the window itself (Esc, the button: the window has
 * focus) is respected until the window is placed again.
 */
export function useTvAutoFullscreen({ allowed, enter }: TvAutoFullscreenOptions): TvAutoFullscreen {
  const [failed, setFailed] = useState(false)
  const [held, setHeld] = useState(false)
  const heldRef = useRef(false)
  const expectingExit = useRef(false)

  const setHold = useCallback((value: boolean) => {
    heldRef.current = value
    setHeld(value)
  }, [])

  const attempt = useCallback(() => {
    if (!allowed || heldRef.current || document.fullscreenElement || document.visibilityState !== 'visible') return
    void enter().then((ok) => setFailed(!ok))
  }, [allowed, enter])

  useEffect(() => {
    if (!held) attempt()
  }, [attempt, held])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') attempt()
    }
    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        setFailed(false)
        return
      }
      // Left by hand inside the window (it has focus); the browser dropping it (TV gone, sleep) is not a choice.
      if (!expectingExit.current && document.hasFocus() && document.visibilityState === 'visible') setHold(true)
      expectingExit.current = false
    }
    const screen = window.screen instanceof EventTarget ? window.screen : null
    window.addEventListener('online', attempt)
    window.addEventListener('focus', attempt)
    document.addEventListener('visibilitychange', onVisible)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    screen?.addEventListener('change', attempt)
    return () => {
      window.removeEventListener('online', attempt)
      window.removeEventListener('focus', attempt)
      document.removeEventListener('visibilitychange', onVisible)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      screen?.removeEventListener('change', attempt)
    }
  }, [attempt, setHold])

  const hold = useCallback(() => {
    expectingExit.current = Boolean(document.fullscreenElement)
    setHold(true)
  }, [setHold])

  const release = useCallback(() => {
    setHold(false)
    attempt()
  }, [attempt, setHold])

  return { failed, hold, release }
}
