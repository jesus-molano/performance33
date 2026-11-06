// Pure rules of Ajustes → Pantallas.

import { TV_READABLE_SECTIONS } from '@/config/app'
import type { ScreenView, SectionWrite } from '@/features/screens/types'
import { defaultScreenName } from './sections'

/** What the text of a name field saves: trimmed, and the default name when left blank. */
export const resolveScreenName = (text: string, id: number): string => text.trim() || defaultScreenName(id)

/** Sections with someone that a lower count would empty; writing them back undoes it. */
export const occupiedBeyond = (screen: ScreenView, count: number): SectionWrite[] =>
  screen.contents.flatMap((content, i) => (i + 1 > count && content.clientId ? [{ ref: { screen: screen.id, section: i + 1 }, content }] : []))

/** More sections than a 27″ TV read from 3-4 m shows comfortably. */
export const isHardToRead = (sections: number): boolean => sections > TV_READABLE_SECTIONS

/** What one 'Deshacer' after fewer sections puts back: the screen as it was, then the sections it emptied. */
export interface SectionsUndo {
  original: ScreenView
  cleared: SectionWrite[]
}

/**
 * Several − in a row on one screen share one undo: it keeps the screen from before the first step and adds the
 * sections each step emptied (a section already listed keeps what it showed first).
 */
export function mergeSectionsUndo(pending: SectionsUndo | null, screen: ScreenView, cleared: SectionWrite[]): SectionsUndo {
  if (!pending) return { original: screen, cleared }
  const listed = new Set(pending.cleared.map((write) => write.ref.section))
  return { original: pending.original, cleared: [...pending.cleared, ...cleared.filter((write) => !listed.has(write.ref.section))] }
}
