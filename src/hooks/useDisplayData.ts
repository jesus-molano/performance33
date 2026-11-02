import { useEffect, useState } from 'react'
import { deepEqual } from '@/lib/deepEqual'
import { loadDisplayData, subscribeDisplayChanges } from '@/persistence/sync'
import type { DisplayData } from '@/types'

export interface LiveDisplayData {
  /** Sanitised data (never contains private fields); null when nothing is stored yet. */
  data: DisplayData | null
  /** Increments on every live update (drive the 'actualizado' flash with it). */
  version: number
}

/**
 * Live data for Pantalla / TV windows, kept in memory: from the server by themselves in the cloud, plus what a
 * dashboard or another TV window of this browser sends. The same change arrives several ways: only the first counts.
 */
export function useDisplayData(): LiveDisplayData {
  const [state, setState] = useState<LiveDisplayData>(() => ({ data: loadDisplayData(), version: 0 }))
  useEffect(() => subscribeDisplayChanges((data) => setState((s) => (deepEqual(s.data, data) ? s : { data, version: s.version + 1 }))), [])
  return state
}
