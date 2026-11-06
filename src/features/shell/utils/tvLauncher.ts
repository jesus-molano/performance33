// Pure rules of the 'Pantallas' menu rows.

import { TV_MAX_SECTIONS, TV_MIN_SECTIONS } from '@/config/app'
import { SCREEN_DETECTION_COPY } from '@/config/screenDetection'
import type { TvPlacement } from '@/lib/tvPlacement'
import { TV_LAUNCHER } from '@/features/shell/config'

/** The number of sections one − / + step gives, or null at the limit (1-6). */
export function stepSections(current: number, delta: -1 | 1): number | null {
  const next = current + delta
  return next < TV_MIN_SECTIONS || next > TV_MAX_SECTIONS ? null : next
}

/**
 * 'Sin abrir · En «LG TV»': whether its window is open, then where it goes (when the screens can be seen). Under its
 * own title a missing one says just 'Desconectada'.
 */
export function screenStatusLine(isOpen: boolean, placement: Pick<TvPlacement, 'note' | 'disconnected'>): string {
  const where = placement.disconnected ? SCREEN_DETECTION_COPY.disconnectedShort : placement.note
  return [isOpen ? TV_LAUNCHER.isOpen : TV_LAUNCHER.notOpen, where].filter(Boolean).join(' · ')
}

/** What the row does: open it; an open one goes back to its place ('Colocar'), or to the front without detection. */
export function screenRowAction(isOpen: boolean, hasDisplay: boolean): string {
  if (!isOpen) return TV_LAUNCHER.open
  return hasDisplay ? TV_LAUNCHER.place : TV_LAUNCHER.focus
}
