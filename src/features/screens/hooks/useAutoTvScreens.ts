import { useEffect, useMemo, useRef } from 'react'
import { useTvDisplays } from '@/hooks'
import { tvCandidates } from '@/lib/tvDisplays'
import { createsScreensHere, followsDetectedTvs, planMissingScreens, unplacedTvCount } from '@/features/screens/utils/autoScreens'
import { defaultScreen } from '@/features/screens/utils/sections'
import { useScreenActions } from './useScreenActions'
import { useBrowserScreenPresence } from './useScreenPresence'
import { useScreens } from './useScreens'

/**
 * One screen per TV of the gym's TV laptop: when a TV has no screen, the missing ones are created (Pantalla N, default
 * sections), once the screens were read from the server. Only where a TV window is already open in this browser, so a
 * coach's computer with an extra monitor never adds screens for the whole gym. Never removes one.
 */
export function useAutoTvScreens(): void {
  const { status, screens } = useScreens()
  const { detection, displayFor, choices } = useTvDisplays()
  const openHere = useBrowserScreenPresence()
  const { ensureScreens } = useScreenActions()
  const tried = useRef(new Set<string>())

  const active = createsScreensHere(followsDetectedTvs(detection.state), openHere.size)
  const ids = useMemo(() => screens.map((s) => s.id), [screens])
  const plan = useMemo(() => {
    if (!active || status !== 'ready') return []
    const tvKeys = tvCandidates(detection.displays).map((d) => d.key)
    const placed = ids.flatMap((id) => displayFor(id)?.key ?? [])
    return planMissingScreens(ids, unplacedTvCount(tvKeys, placed), Object.keys(choices).map(Number))
  }, [active, status, ids, detection.displays, displayFor, choices])

  useEffect(() => {
    const key = plan.join(',')
    // Each plan once per page: a failed write is not retried in a loop (the next change of TVs tries again).
    if (!plan.length || tried.current.has(key)) return
    tried.current.add(key)
    void ensureScreens(plan.map(defaultScreen))
  }, [plan, ensureScreens])
}
