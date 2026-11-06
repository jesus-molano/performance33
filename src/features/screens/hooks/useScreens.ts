import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useScreensStore } from '@/features/screens/store/screensStore'
import type { ScreensStatus, ScreenView } from '@/features/screens/types'
import { buildScreenViews } from '@/features/screens/utils/views'
import { useScreensConnection } from './useScreensConnection'

export interface ScreensList {
  status: ScreensStatus
  /** Every screen of the gym, in order, with what each section shows and whether its window is open. */
  screens: ScreenView[]
}

/** The screens of the gym, live (listScreens). */
export function useScreens(): ScreensList {
  useScreensConnection()
  const { status, screens, sections, online } = useScreensStore(
    useShallow((state) => ({ status: state.status, screens: state.screens, sections: state.sections, online: state.online })),
  )
  const views = useMemo(() => buildScreenViews(screens, sections, online), [screens, sections, online])
  return { status, screens: views }
}
