import { useMemo } from 'react'
import { useIsMobile, useTvDisplays, type ScreenDetailsApi } from '@/hooks'
import type { ScreenView } from '@/features/screens/types'
import { choiceFromValue, displayChoiceRows, type DisplayChoiceRow } from '@/features/screens/utils/detectedDisplays'

export interface DetectedDisplaysApi {
  /** Phones never open TV windows, so there is nothing to detect. */
  visible: boolean
  detection: ScreenDetailsApi
  tvCount: number
  /** Only once more than one screen is seen: then there is something to choose. */
  rows: DisplayChoiceRow[]
  choose: (screen: number, value: string) => void
}

/** 'Teles detectadas en este portátil': what this computer sees and which TV each screen opens on. */
export function useDetectedDisplays(screens: readonly ScreenView[]): DetectedDisplaysApi {
  const isMobile = useIsMobile()
  const { detection, tvCount, choices, choose } = useTvDisplays()
  const rows = useMemo(
    () => (detection.displays.length > 1 ? displayChoiceRows(screens, choices, detection.displays) : []),
    [screens, choices, detection.displays],
  )
  return { visible: !isMobile, detection, tvCount, rows, choose: (screen, value) => choose(screen, choiceFromValue(value)) }
}
