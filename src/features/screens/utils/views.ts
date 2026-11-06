// Screens as the app shows them: each with what its sections show and whether its window is open.

import type { ScreenConfig, ScreenView, SectionMap } from '@/features/screens/types'
import { defaultScreen, screenContents } from './sections'

/** A screen as saved, or its defaults when the gym does not have it (yet). */
export const screenConfigOf = (screens: readonly ScreenConfig[], id: number): ScreenConfig =>
  screens.find((s) => s.id === id) ?? defaultScreen(id)

export const buildScreenViews = (screens: readonly ScreenConfig[], sections: SectionMap, online: ReadonlySet<number>): ScreenView[] =>
  screens.map((screen) => ({ ...screen, contents: screenContents(sections, screen.id, screen.sections), online: online.has(screen.id) }))
