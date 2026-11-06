import { useCallback, useEffect, useRef, useState } from 'react'

export interface ToastTimer {
  /** Spread on the toast: the time stops while the pointer is over it or a button in it has focus. */
  handlers: { onMouseEnter: () => void; onMouseLeave: () => void; onFocus: () => void; onBlur: () => void }
}

/** Closes a toast after `durationMs` of being on screen unattended, so a coach reaching for 'Deshacer' never loses it. */
export function useToastTimer(durationMs: number, onExpire: () => void): ToastTimer {
  const [paused, setPaused] = useState(false)
  const remaining = useRef(durationMs)

  useEffect(() => {
    if (paused) return
    const startedAt = Date.now()
    const timer = setTimeout(onExpire, remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt))
    }
  }, [paused, onExpire])

  const pause = useCallback(() => setPaused(true), [])
  const resume = useCallback(() => setPaused(false), [])
  return { handlers: { onMouseEnter: pause, onMouseLeave: resume, onFocus: pause, onBlur: resume } }
}
