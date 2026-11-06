import { useMemo } from 'react'
import { summarizeScreens, type ScreensSummary } from '@/features/screens/utils/picker'
import { useScreens } from './useScreens'

/** How many of the gym's screens have their TV window open; null until they are known. */
export function useScreensSummary(): ScreensSummary | null {
  const { status, screens } = useScreens()
  return useMemo(() => (status === 'idle' ? null : summarizeScreens(screens)), [status, screens])
}
