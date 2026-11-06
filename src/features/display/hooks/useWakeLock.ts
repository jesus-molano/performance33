import { useEffect } from 'react'

/**
 * Keeps the computer from dimming or sleeping the screen while this window is visible (a TV left on for a whole
 * class). The browser lets go when the tab is hidden, so it is asked again when the tab comes back. Ignored where the
 * browser cannot do it.
 */
export function useWakeLock(): void {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let stopped = false

    const request = () => {
      if (lock || document.visibilityState !== 'visible') return
      navigator.wakeLock.request('screen').then(
        (sentinel) => {
          if (stopped) {
            void sentinel.release()
            return
          }
          lock = sentinel
          sentinel.addEventListener('release', () => {
            lock = null
          })
        },
        () => undefined,
      )
    }

    document.addEventListener('visibilitychange', request)
    request()
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', request)
      void lock?.release()
    }
  }, [])
}
