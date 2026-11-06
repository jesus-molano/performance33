// TV screens and their sections, shared by every coach and every TV window (see ARCHITECTURE.md).

export { ScreenPicker, type ScreenPickerProps } from './components/ScreenPicker'
export { ScreenSendButton, type ScreenSendButtonProps } from './components/ScreenSendButton'
export { SendButton, type SendButtonProps } from './components/SendButton'
export { ScreensPanel } from './components/ScreensPanel'
export { ScreensStatusChip, type ScreensStatusChipProps } from './components/ScreensStatusChip'
export { TvWindowsActions, type TvWindowsActionsProps } from './components/TvWindowsActions'
export { SEND_COPY } from './config/copy'
export { FILL_COPY } from './config/fill'
export { useClearScreens, useFillScreens, useScreensEmpty } from './hooks/useScreensBulk'
export type { FillPerson } from './utils/fill'
export { useAutoTvScreens } from './hooks/useAutoTvScreens'
export { useScreenActions } from './hooks/useScreenActions'
export { useBrowserScreenPresence, useScreenPresence, useTrackScreenPresence } from './hooks/useScreenPresence'
export { useScreens, type ScreensList } from './hooks/useScreens'
export { useScreensPanel, type ScreensPanelApi } from './hooks/useScreensPanel'
export { useScreenSections, type ScreenSections } from './hooks/useScreenSections'
export { useScreensSummary } from './hooks/useScreensSummary'
export { useSendButton, type SendButtonWiring } from './hooks/useSendButton'
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
export {
  initialScreenDay,
  pickedScreenDay,
  screenDayOptions,
  shownScreenDay,
  type ScreenDayOption,
} from './utils/screenDays'
export { REMOTE_COPY } from './config/remote'
export { useScreensRemote, type ScreensRemote } from './hooks/useScreensRemote'
export { useSectionEdits, type SectionEdits } from './hooks/useSectionEdits'
export { isWideScreen } from './utils/picker'
export { findRemotePeople, type RemotePerson, type RemoteScreen, type RemoteTile } from './utils/remote'
