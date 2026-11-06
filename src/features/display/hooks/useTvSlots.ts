import { useCallback, useMemo, useState } from 'react'
import { serializeTvSlots, type TvSlot } from '@/lib/routes'
import { useScreenActions, useScreenSections, type ScreensStatus } from '@/features/screens'
import {
  addSlot,
  assignSlotClient,
  canAddSlot,
  canRemoveSlot,
  moveSlot,
  reconcileSlotKeys,
  removeLastSlot,
  replaceSlot,
  tvSlotSortId,
  type TvSlotKeys,
} from '@/features/display/utils/tvSlots'
import { useTvScreenSetup } from './useTvScreenSetup'

export interface TvSlotsApi {
  status: ScreensStatus
  /** Nothing read yet and the first read failed: trying again. */
  loadFailed: boolean
  /** False once the gym's screens are read without this one (removed in Ajustes). */
  exists: boolean
  /** Name of the screen as saved ('Pantalla 2'). */
  name: string
  /** What each section shows, in order. */
  slots: TvSlot[]
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
 * The sections of one screen, as saved for the whole gym: every change on the TV is written there, and changes made
 * anywhere else (another TV, a coach's phone) arrive here live. `candidateClientIds` (clients with a routine, in picker
 * order) fill a newly added section. An old ?slots= link fills the screen once, if it was empty.
 */
export function useTvSlots(screen: number, legacySlots: TvSlot[] | null, candidateClientIds: readonly string[]): TvSlotsApi {
  const { status, loadFailed, exists, config, contents } = useScreenSections(screen)
  const actions = useScreenActions()
  useTvScreenSetup(screen, legacySlots, status)
  const slots = useMemo(() => contents.map(({ clientId, day }) => ({ clientId, day })), [contents])

  // A move sets the keys together with the sections (same batch); any other change keeps or resizes them.
  const [storedKeys, setStoredKeys] = useState<TvSlotKeys>(() => reconcileSlotKeys(null, slots))
  const slotKeys = reconcileSlotKeys(storedKeys, slots)
  if (slotKeys !== storedKeys) setStoredKeys(slotKeys)
  const keys = slotKeys.keys
  const slotIds = useMemo(() => keys.map(tvSlotSortId), [keys])

  const sectionOf = useCallback((index: number) => ({ screen, section: index + 1 }), [screen])
  const resize = useCallback((count: number) => void actions.saveScreen({ ...config, sections: count }), [actions, config])

  const setSlotClient = useCallback(
    (index: number, clientId: string | null) => {
      const next = assignSlotClient(slots, index, clientId)
      // Like the 'Pantalla' button: whoever is picked leaves any other section, a person is on one screen at a time.
      if (next !== slots) actions.send(sectionOf(index), next[index])
    },
    [slots, actions, sectionOf],
  )
  const setSlotDay = useCallback(
    (index: number, day: number) => actions.assign(sectionOf(index), replaceSlot(slots, index, { day })[index]),
    [slots, actions, sectionOf],
  )
  const addColumn = useCallback(() => {
    const next = addSlot(slots, candidateClientIds)
    if (next === slots) return
    resize(next.length)
    const added = next[next.length - 1]
    if (added.clientId) actions.assign(sectionOf(next.length - 1), added)
  }, [slots, candidateClientIds, resize, actions, sectionOf])
  const removeColumn = useCallback(() => {
    const next = removeLastSlot(slots)
    if (next !== slots) resize(next.length)
  }, [slots, resize])
  const moveColumn = useCallback(
    (from: number, to: number) => {
      const next = moveSlot(slots, from, to)
      if (next === slots) return
      setStoredKeys({ serialized: serializeTvSlots(next), keys: moveSlot(keys, from, to) })
      actions.reorder(screen, from + 1, to + 1)
    },
    [slots, keys, actions, screen],
  )

  return {
    status,
    loadFailed,
    exists,
    name: config.name,
    slots,
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
