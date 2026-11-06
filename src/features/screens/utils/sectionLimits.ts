// Which sections can be written and which go when a screen changes its count. The same rule as schema.sql
// (trim_screen_sections), so local test mode and the cloud agree.

import type { ScreenConfig, ScreenSection, SectionMap, SectionWrite } from '@/features/screens/types'
import { sectionIdsBeyond } from './sections'

const countOf = (screens: readonly ScreenConfig[], id: number): number | null => screens.find((s) => s.id === id)?.sections ?? null

/**
 * Only writes to a screen the gym has, within its sections. A removed screen is never brought back by a write, and a
 * section past the count (a window that had not heard of a change yet) never waits hidden to reappear later.
 */
export const writableWrites = (screens: readonly ScreenConfig[], writes: readonly SectionWrite[]): SectionWrite[] =>
  writes.filter(({ ref }) => ref.section <= (countOf(screens, ref.screen) ?? 0))

/** Sections a screen loses when its count changes: past the old count or the new one, whichever is smaller. */
export function sectionsResizedAway(sections: SectionMap, before: readonly ScreenConfig[], screen: ScreenConfig): string[] {
  const old = countOf(before, screen.id)
  if (old === null || old === screen.sections) return []
  return sectionIdsBeyond(sections, screen.id, Math.min(old, screen.sections))
}

/** The sections that remain once `after` replaces `before` (local test mode's copy of the database rule). */
export function sectionsAfterResize(sections: readonly ScreenSection[], before: readonly ScreenConfig[], after: readonly ScreenConfig[]): ScreenSection[] {
  return sections.filter((section) => {
    const old = countOf(before, section.screen)
    const next = countOf(after, section.screen)
    return old === null || next === null || old === next || section.section <= Math.min(old, next)
  })
}
