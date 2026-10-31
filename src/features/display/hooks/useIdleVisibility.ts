import { useEffect, useState } from 'react'

const ACTIVITY_EVENTS = ['mousemove', 'pointerdown', 'keydown', 'touchstart', 'wheel'] as const

/** True while the viewer is interacting; false after `idleMs` without activity (controls fade out). */
export function useIdleVisibility(idleMs: number): boolean {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let timer = window.setTimeout(() => setVisible(false), idleMs)
    const onActivity = () => {
      setVisible(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setVisible(false), idleMs)
    }
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, onActivity, { passive: true })
    return () => {
      window.clearTimeout(timer)
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, onActivity)
    }
  }, [idleMs])

  return visible
}
