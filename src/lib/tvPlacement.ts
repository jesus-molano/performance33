// Plain words for where a Pantalla opens on this computer.

import { SCREEN_DETECTION_COPY } from '@/config/screenDetection'
import type { DetectedDisplay } from './screenDetails'

export interface TvPlacementInput {
  title: string
  /** Its window is already open (the button brings it to the front). */
  isOpen: boolean
  /** The TV it opens on now, if any. */
  display: DetectedDisplay | null
  /** This computer sees at least one TV. */
  tvsDetected: boolean
}

export interface TvPlacement {
  /** 'En «LG TV»' or 'Pantalla 2 desconectada'; null when the TVs cannot be seen at all (a guide says why). */
  note: string | null
  /** Its TV is not connected now. */
  disconnected: boolean
  openLabel: string
}

export function describeTvPlacement({ title, isOpen, display, tvsDetected }: TvPlacementInput): TvPlacement {
  const disconnected = tvsDetected && !display
  const note = !tvsDetected ? null : display ? SCREEN_DETECTION_COPY.on(display.label) : SCREEN_DETECTION_COPY.disconnected(title)
  let openLabel = SCREEN_DETECTION_COPY.open(title)
  if (isOpen) openLabel = SCREEN_DETECTION_COPY.focus(title)
  else if (display) openLabel = SCREEN_DETECTION_COPY.openOn(title, display.label)
  return { note, disconnected, openLabel }
}
