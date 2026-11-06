// TV screens and their sections, shared by every coach and every TV window (see ARCHITECTURE.md).

export { useScreenActions } from './hooks/useScreenActions'
export { useScreenPresence, useTrackScreenPresence } from './hooks/useScreenPresence'
export { useScreens, type ScreensList } from './hooks/useScreens'
export { useScreenSections, type ScreenSections } from './hooks/useScreenSections'
export type { ScreensActions } from './store/screensActions'
export type {
  ScreenConfig,
  ScreenSection,
  ScreensStatus,
  ScreenView,
  SectionChange,
  SectionContent,
  SectionRef,
  SectionTarget,
  SectionWrite,
} from './types'
export { defaultScreenName, EMPTY_SECTION, gridFor, parseSectionId, sectionId } from './utils/sections'
