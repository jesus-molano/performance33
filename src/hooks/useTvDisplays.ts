import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import type { DetectedDisplay } from '@/lib/screenDetails'
import {
  readAutomaticTvDisplaysRaw,
  readKnownScreens,
  readTvDisplaysRaw,
  saveAutomaticTvDisplays,
  saveTvDisplays,
  subscribeAutomaticTvDisplays,
  subscribeKnownScreens,
  subscribeTvDisplays,
} from '@/lib/tvDisplayStore'
import {
  assignTvDisplay,
  canRememberTvDisplays,
  parseTvDisplayMap,
  rememberTvDisplays,
  resolveTvDisplays,
  tvCandidates,
  type TvDisplayMap,
} from '@/lib/tvDisplays'
import { useScreenDetails, type ScreenDetailsApi } from './useScreenDetails'

export interface TvDisplays {
  detection: ScreenDetailsApi
  /** TVs found (every screen but the main one). */
  tvCount: number
  /** The detected screen a Pantalla opens on now, or null (no TVs detected, or its TV is not connected). */
  displayFor: (screen: number) => DetectedDisplay | null
  /** Screens chosen by hand on this computer. */
  choices: TvDisplayMap
  /** What the automatic Pantallas got on this computer (shared by its windows). */
  remembered: TvDisplayMap
  /** Chooses the screen of a Pantalla on this computer (null: automatic). */
  choose: (screen: number, key: string | null) => void
}

/** Which TV each Pantalla goes to on this computer, from what the browser detects and what was chosen here. */
export function useTvDisplays(): TvDisplays {
  const detection = useScreenDetails()
  const raw = useSyncExternalStore(subscribeTvDisplays, readTvDisplaysRaw)
  const choices = useMemo(() => parseTvDisplayMap(raw), [raw])
  const rememberedRaw = useSyncExternalStore(subscribeAutomaticTvDisplays, readAutomaticTvDisplaysRaw)
  const remembered = useMemo(() => parseTvDisplayMap(rememberedRaw), [rememberedRaw])
  // Only the gym's screens get a TV, once they were read (until then, every number).
  const existing = useSyncExternalStore(subscribeKnownScreens, readKnownScreens)
  const resolved = useMemo(
    () => resolveTvDisplays(choices, detection.displays, remembered, existing),
    [choices, detection.displays, remembered, existing],
  )
  // A TV that goes away leaves its Pantalla 'desconectada': the others keep theirs. Every window of this browser
  // shares it, so a window closed and opened again gets the TV the dashboard shows for it.
  useEffect(() => {
    if (canRememberTvDisplays(detection.state, existing)) saveAutomaticTvDisplays(rememberTvDisplays(choices, resolved, remembered))
  }, [choices, resolved, remembered, detection.state, existing])

  const displayFor = useCallback((screen: number) => resolved.get(screen) ?? null, [resolved])
  const choose = useCallback((screen: number, key: string | null) => saveTvDisplays(assignTvDisplay(choices, screen, key)), [choices])

  return { detection, tvCount: tvCandidates(detection.displays).length, displayFor, choices, remembered, choose }
}
