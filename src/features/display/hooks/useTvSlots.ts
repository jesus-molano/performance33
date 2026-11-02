import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { paths, replaceRoute, serializeTvSlots, type TvSlot } from '@/lib/routes'
import {
  addSlot,
  assignSlotClient,
  canAddSlot,
  canRemoveSlot,
  isEmptySlotSet,
  loadStoredSlots,
  moveSlot,
  reconcileSlotKeys,
  removeLastSlot,
  replaceSlot,
  resizeSlotKeys,
  storeSlots,
  tvSlotSortId,
  type TvSlotKeys,
} from '@/features/display/utils/tvSlots'

export interface TvSlotsApi {
  /** One stable id per column (React key + sortable id): it follows the column when it moves. */
  slotIds: string[]
  setSlotClient: (index: number, clientId: string | null) => void
  setSlotDay: (index: number, day: number) => void
  addColumn: () => void
  removeColumn: () => void
  moveColumn: (from: number, to: number) => void
  canAddColumn: boolean
  canRemoveColumn: boolean
}

/**
 * The URL (#/tv?slots=) is the source of truth so a bookmarked TV setup survives reloads;
 * every change is mirrored to this screen's localStorage key and restored when the URL arrives empty.
 * `candidateClientIds` (clients with a routine, in picker order) fill a newly added column.
 */
export function useTvSlots(screen: number, slots: TvSlot[], candidateClientIds: readonly string[]): TvSlotsApi {
  // Restore only on mount: emptying the setup later on is a deliberate choice.
  const initialSlots = useRef(slots)
  useEffect(() => {
    if (!isEmptySlotSet(initialSlots.current)) return
    const stored = loadStoredSlots(screen)
    if (stored) replaceRoute(paths.tv(stored, screen))
  }, [screen])

  // Our own changes set the keys together with the route (same batch); outside URL changes resize them.
  const [storedKeys, setStoredKeys] = useState<TvSlotKeys>(() => reconcileSlotKeys(null, slots))
  const slotKeys = reconcileSlotKeys(storedKeys, slots)
  if (slotKeys !== storedKeys) setStoredKeys(slotKeys)
  const keys = slotKeys.keys
  const slotIds = useMemo(() => keys.map(tvSlotSortId), [keys])

  const commit = useCallback(
    (next: TvSlot[], nextKeys: number[] = resizeSlotKeys(keys, next.length)) => {
      if (next === slots) return
      setStoredKeys({ serialized: serializeTvSlots(next), keys: nextKeys })
      storeSlots(screen, next)
      replaceRoute(paths.tv(next, screen))
    },
    [screen, slots, keys],
  )

  const setSlotClient = useCallback(
    (index: number, clientId: string | null) => commit(assignSlotClient(slots, index, clientId)),
    [slots, commit],
  )
  const setSlotDay = useCallback(
    (index: number, day: number) => commit(replaceSlot(slots, index, { day })),
    [slots, commit],
  )
  const addColumn = useCallback(() => commit(addSlot(slots, candidateClientIds)), [slots, candidateClientIds, commit])
  const removeColumn = useCallback(() => commit(removeLastSlot(slots)), [slots, commit])
  const moveColumn = useCallback(
    (from: number, to: number) => commit(moveSlot(slots, from, to), moveSlot(keys, from, to)),
    [slots, keys, commit],
  )

  return {
    slotIds,
    setSlotClient,
    setSlotDay,
    addColumn,
    removeColumn,
    moveColumn,
    canAddColumn: canAddSlot(slots),
    canRemoveColumn: canRemoveSlot(slots),
  }
}
