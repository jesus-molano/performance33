import { useMemo } from 'react'
import { useScreensStore } from '@/features/screens/store/screensStore'
import type { ScreenConfig, ScreensStatus, SectionContent } from '@/features/screens/types'
import { screenContents } from '@/features/screens/utils/sections'
import { screenConfigOf } from '@/features/screens/utils/views'
import { useScreensConnection } from './useScreensConnection'

export interface ScreenSections {
  status: ScreensStatus
  /** Nothing read yet and the first read failed: trying again. */
  loadFailed: boolean
  /** The gym has this screen (false once read without it: it was removed, or never added). */
  exists: boolean
  /** As saved, or the defaults while the gym does not have this screen. */
  config: ScreenConfig
  /** One per section, in order, empty ones included. */
  contents: SectionContent[]
}

/** What each section of one screen shows, live. */
export function useScreenSections(screen: number): ScreenSections {
  useScreensConnection()
  const status = useScreensStore((state) => state.status)
  const loadFailed = useScreensStore((state) => state.loadFailed)
  const screens = useScreensStore((state) => state.screens)
  const sections = useScreensStore((state) => state.sections)
  const config = useMemo(() => screenConfigOf(screens, screen), [screens, screen])
  const contents = useMemo(() => screenContents(sections, screen, config.sections), [sections, screen, config.sections])
  const exists = status === 'idle' || screens.some((s) => s.id === screen)
  return { status, loadFailed, exists, config, contents }
}
