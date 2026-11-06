// Where a TV window is on the desktop, compared with the screen it belongs to. Pure: the frame is passed in.

import type { ScreenArea } from '@/lib/screenDetails'

/** Position and size of a window on the desktop (window.screenX/Y, outerWidth/Height). */
export interface WindowFrame {
  left: number
  top: number
  width: number
  height: number
}

/** The middle of the window is on that screen (Windows moves windows off a screen that goes away). */
export function isWindowOn(frame: WindowFrame, area: ScreenArea): boolean {
  const x = frame.left + frame.width / 2
  const y = frame.top + frame.height / 2
  return x >= area.left && x < area.left + area.width && y >= area.top && y < area.top + area.height
}

export const currentWindowFrame = (): WindowFrame => ({
  left: window.screenX,
  top: window.screenY,
  width: window.outerWidth,
  height: window.outerHeight,
})
