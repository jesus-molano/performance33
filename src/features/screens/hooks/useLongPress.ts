import { useCallback, useEffect, useRef, type PointerEvent } from 'react'
import { SCREEN_SEND_LONG_PRESS_MS, SCREEN_SEND_LONG_PRESS_TOLERANCE_PX } from '@/config/app'

export interface LongPressHandlers {
  onPointerDown: (event: PointerEvent) => void
  onPointerMove: (event: PointerEvent) => void
  onPointerUp: () => void
  onPointerLeave: () => void
  onPointerCancel: () => void
  onContextMenu: (event: { preventDefault: () => void }) => void
}

export interface LongPress {
  handlers: LongPressHandlers
  /** True once for the click that ends a long press, which must then do nothing. */
  consumeClick: () => boolean
}

/** Holding a finger (or pen) on a button. A mouse has Ctrl+clic instead, so a slow click stays a click. */
export function useLongPress(onLongPress: () => void): LongPress {
  const timer = useRef<number | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)
  const action = useRef(onLongPress)
  useEffect(() => {
    action.current = onLongPress
  }, [onLongPress])

  const cancel = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    start.current = null
  }, [])
  useEffect(() => cancel, [cancel])

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      fired.current = false
      if (event.pointerType === 'mouse') return
      cancel()
      start.current = { x: event.clientX, y: event.clientY }
      timer.current = window.setTimeout(() => {
        fired.current = true
        cancel()
        action.current()
      }, SCREEN_SEND_LONG_PRESS_MS)
    },
    [cancel],
  )

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const from = start.current
      if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > SCREEN_SEND_LONG_PRESS_TOLERANCE_PX) cancel()
    },
    [cancel],
  )

  const consumeClick = useCallback(() => {
    const wasLongPress = fired.current
    fired.current = false
    return wasLongPress
  }, [])

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu: (event) => event.preventDefault(),
    },
    consumeClick,
  }
}
