import { useCallback, useEffect, useRef } from 'react'
import { paths, replaceRoute, type TvSlot } from '@/lib/routes'
import { isEmptySlotSet, loadStoredSlots, replaceSlot, storeSlots } from '@/features/display/utils/tvSlots'

export interface TvSlotsApi {
  setSlotClient: (index: number, clientId: string | null) => void
  setSlotDay: (index: number, day: number) => void
}

/**
 * The URL (#/tv?slots=) is the source of truth so a bookmarked TV setup survives reloads;
 * every change is mirrored to localStorage and restored when the URL arrives empty.
 */
export function useTvSlots(slots: TvSlot[]): TvSlotsApi {
  // Restore only on mount: emptying the setup later on is a deliberate choice.
  const initialSlots = useRef(slots)
  useEffect(() => {
    if (!isEmptySlotSet(initialSlots.current)) return
    const stored = loadStoredSlots()
    if (stored) replaceRoute(paths.tv(stored))
  }, [])

  const commit = useCallback((next: TvSlot[]) => {
    storeSlots(next)
    replaceRoute(paths.tv(next))
  }, [])

  const setSlotClient = useCallback(
    (index: number, clientId: string | null) => commit(replaceSlot(slots, index, { clientId, day: 1 })),
    [slots, commit],
  )
  const setSlotDay = useCallback(
    (index: number, day: number) => commit(replaceSlot(slots, index, { day })),
    [slots, commit],
  )

  return { setSlotClient, setSlotDay }
}
