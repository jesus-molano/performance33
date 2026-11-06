import { useMemo } from 'react'
import { usePhoneScreen, useTvDisplays, type ScreenDetailsApi } from '@/hooks'
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

/** 'Pantallas detectadas en este portátil': what this computer sees and which TV each screen opens on. */
export function useDetectedDisplays(screens: readonly ScreenView[]): DetectedDisplaysApi {
  const phone = usePhoneScreen()
  const { detection, tvCount, choices, remembered, choose } = useTvDisplays()
  const rows = useMemo(
    () => (detection.displays.length > 1 ? displayChoiceRows(screens, choices, detection.displays, remembered) : []),
    [screens, choices, detection.displays, remembered],
  )
  return { visible: !phone, detection, tvCount, rows, choose: (screen, value) => choose(screen, choiceFromValue(value)) }
}
