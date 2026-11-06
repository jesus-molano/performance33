// The screens the browser reports, as the app names and tells them apart. Pure: tested without a browser.

import { SCREEN_DETECTION_COPY } from '@/config/screenDetection'
import type { DetectedDisplay, ScreenDetection, ScreenLike } from './screenDetails'

/** Two identical TVs share a label, so their position tells them apart. */
export function toDetectedDisplays(screens: readonly ScreenLike[]): DetectedDisplay[] {
  return screens.map((screen, index) => {
    const label = screen.label.trim() || SCREEN_DETECTION_COPY.unnamedScreen(index + 1)
    const unique = screens.filter((other) => other.label.trim() === screen.label.trim()).length === 1
    return {
      key: unique && screen.label.trim() ? label : `${label}@${screen.left},${screen.top}`,
      label,
      isPrimary: screen.isPrimary,
      isInternal: screen.isInternal,
      area: { left: screen.availLeft, top: screen.availTop, width: screen.availWidth, height: screen.availHeight },
      bounds: { left: screen.left, top: screen.top, width: screen.width || screen.availWidth, height: screen.height || screen.availHeight },
      source: screen,
    }
  })
}

export function detectionFromScreens(screens: readonly ScreenLike[]): ScreenDetection {
  const displays = toDetectedDisplays(screens)
  return { state: displays.length > 1 ? 'ok' : 'single', displays }
}
