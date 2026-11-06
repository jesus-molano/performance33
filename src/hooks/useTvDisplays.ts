import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { DetectedDisplay } from '@/lib/screenDetails'
import { readTvDisplaysRaw, saveTvDisplays, subscribeTvDisplays } from '@/lib/tvDisplayStore'
import { assignTvDisplay, parseTvDisplayMap, resolveTvDisplays, tvCandidates, type TvDisplayMap } from '@/lib/tvDisplays'
import { useScreenDetails, type ScreenDetailsApi } from './useScreenDetails'

export interface TvDisplays {
  detection: ScreenDetailsApi
  /** TVs found (every screen but the main one). */
  tvCount: number
  /** The detected screen a Pantalla opens on now, or null (no TVs detected, or its TV is not connected). */
  displayFor: (screen: number) => DetectedDisplay | null
  /** Screens chosen by hand on this computer. */
  choices: TvDisplayMap
  /** Chooses the screen of a Pantalla on this computer (null: automatic). */
  choose: (screen: number, key: string | null) => void
}

/** Which TV each Pantalla goes to on this computer, from what the browser detects and what was chosen here. */
export function useTvDisplays(): TvDisplays {
  const detection = useScreenDetails()
  const raw = useSyncExternalStore(subscribeTvDisplays, readTvDisplaysRaw)
  const choices = useMemo(() => parseTvDisplayMap(raw), [raw])
  const resolved = useMemo(() => resolveTvDisplays(choices, detection.displays), [choices, detection.displays])

  const displayFor = useCallback((screen: number) => resolved.get(screen) ?? null, [resolved])
  const choose = useCallback((screen: number, key: string | null) => saveTvDisplays(assignTvDisplay(choices, screen, key)), [choices])

  return { detection, tvCount: tvCandidates(detection.displays).length, displayFor, choices, choose }
}
