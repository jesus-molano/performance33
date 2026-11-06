import { useCallback, useEffect, useRef, useState } from 'react'
import { TV_MANUAL_EXIT_CHECK_MS } from '@/features/display/config/display'

export interface TvAutoFullscreenOptions {
  /** The browser allows fullscreen without a click (Chrome policy) and this screen has its TV. */
  allowed: boolean
  enter: () => Promise<boolean>
  /** The window is on its TV now (not moved to the laptop by Windows because the TV went away). */
  isOnTv: () => boolean
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
 * again, moved to another screen). A coach who leaves fullscreen in the window itself (Esc, the button) is respected
 * until the window goes fullscreen again or is placed again. Leaving it because the TV went away is not a choice: a
 * moment later the window is no longer on its TV (or the TV is gone), so nothing is held.
 */
export function useTvAutoFullscreen({ allowed, enter, isOnTv }: TvAutoFullscreenOptions): TvAutoFullscreen {
  const [failed, setFailed] = useState(false)
  const [held, setHeld] = useState(false)
  const heldRef = useRef(false)
  const expectingExit = useRef(false)
  const latest = useRef({ allowed, isOnTv })
  useEffect(() => {
    latest.current = { allowed, isOnTv }
  })

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
    let exitCheck: number | null = null
    const onVisible = () => {
      if (document.visibilityState === 'visible') attempt()
    }
    const onFullscreenChange = () => {
      if (exitCheck !== null) window.clearTimeout(exitCheck)
      exitCheck = null
      if (document.fullscreenElement) {
        // Fullscreen again (the bar, the button, F): it is meant to be on its TV, so a later drop comes back by itself.
        setFailed(false)
        setHold(false)
        return
      }
      if (expectingExit.current) {
        expectingExit.current = false
        return
      }
      // Only a window in use can be left by hand; even then, focus alone does not prove it (the TV can drop meanwhile).
      if (!document.hasFocus() || document.visibilityState !== 'visible') return
      exitCheck = window.setTimeout(() => {
        exitCheck = null
        const { allowed: stillAllowed, isOnTv: onTv } = latest.current
        if (!document.fullscreenElement && stillAllowed && onTv()) setHold(true)
      }, TV_MANUAL_EXIT_CHECK_MS)
    }
    const screen = window.screen instanceof EventTarget ? window.screen : null
    window.addEventListener('online', attempt)
    window.addEventListener('focus', attempt)
    document.addEventListener('visibilitychange', onVisible)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    screen?.addEventListener('change', attempt)
    return () => {
      if (exitCheck !== null) window.clearTimeout(exitCheck)
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
