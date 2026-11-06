// TV screens and their sections, shared by every coach and every TV window (see ARCHITECTURE.md).

export { ScreenPicker, type ScreenPickerProps } from './components/ScreenPicker'
export { ScreenSendButton, type ScreenSendButtonProps } from './components/ScreenSendButton'
export { ScreensPanel } from './components/ScreensPanel'
export { ScreensStatusChip, type ScreensStatusChipProps } from './components/ScreensStatusChip'
export { SEND_COPY } from './config/copy'
export { useScreenActions } from './hooks/useScreenActions'
export { useBrowserScreenPresence, useScreenPresence, useTrackScreenPresence } from './hooks/useScreenPresence'
export { useScreens, type ScreensList } from './hooks/useScreens'
export { useScreensPanel, type ScreensPanelApi } from './hooks/useScreensPanel'
export { useScreenSections, type ScreenSections } from './hooks/useScreenSections'
export { useScreensSummary } from './hooks/useScreensSummary'
export { useSendToScreen, type SendToScreen, type SendToScreenInput } from './hooks/useSendToScreen'
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
export type { ScreensSummary } from './utils/picker'
export { defaultScreenName, EMPTY_SECTION, emptyGridCells, gridFor, parseSectionId, sectionId } from './utils/sections'
