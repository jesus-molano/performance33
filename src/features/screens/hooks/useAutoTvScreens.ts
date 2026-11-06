import { useEffect, useMemo, useRef } from 'react'
import { useTvDisplays } from '@/hooks'
import { TV_DEFAULT_SCREEN, TV_MAX_SCREENS } from '@/config/app'
import { followsDetectedTvs, planMissingScreens } from '@/features/screens/utils/autoScreens'
import { defaultScreen } from '@/features/screens/utils/sections'
import { useScreenActions } from './useScreenActions'
import { useScreens } from './useScreens'

const SCREEN_NUMBERS = Array.from({ length: TV_MAX_SCREENS - TV_DEFAULT_SCREEN + 1 }, (_, i) => TV_DEFAULT_SCREEN + i)

/**
 * One screen per TV this laptop sees: when it sees more TVs than the gym has screens, the missing ones are created
 * (Pantalla N, default sections), once the screens were read from the server. Never removes one.
 */
export function useAutoTvScreens(): void {
  const { status, screens } = useScreens()
  const { detection, tvCount, displayFor } = useTvDisplays()
  const { ensureScreens } = useScreenActions()
  const tried = useRef(new Set<string>())

  const following = followsDetectedTvs(detection.state)
  const ids = useMemo(() => screens.map((s) => s.id), [screens])
  const assigned = useMemo(() => SCREEN_NUMBERS.filter((n) => displayFor(n) !== null), [displayFor])
  const plan = useMemo(
    () => (following && status === 'ready' ? planMissingScreens(ids, tvCount, assigned) : []),
    [following, status, ids, tvCount, assigned],
  )

  useEffect(() => {
    const key = plan.join(',')
    // Each plan once per page: a failed write is not retried in a loop (the next change of TVs tries again).
    if (!plan.length || tried.current.has(key)) return
    tried.current.add(key)
    void ensureScreens(plan.map(defaultScreen))
  }, [plan, ensureScreens])
}
