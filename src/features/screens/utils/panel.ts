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
