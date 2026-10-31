import { useEffect, useState } from 'react'
import { loadDisplayData, subscribeDisplayChanges } from '@/persistence/sync'
import type { DisplayData } from '@/types'

export interface LiveDisplayData {
  /** Sanitised data (never contains private fields); null when nothing is stored yet. */
  data: DisplayData | null
  /** Increments on every live update (drive the 'actualizado' flash with it). */
  version: number
}

/** Live data for Pantalla / TV windows, fed by other tabs via BroadcastChannel + storage. */
export function useDisplayData(): LiveDisplayData {
  const [state, setState] = useState<LiveDisplayData>(() => ({ data: loadDisplayData(), version: 0 }))
  useEffect(() => subscribeDisplayChanges((data) => setState((s) => ({ data, version: s.version + 1 }))), [])
  return state
}
