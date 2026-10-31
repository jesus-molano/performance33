import { describe, expect, it } from 'vitest'
import { TV_MAX_SLOTS, TV_MIN_SLOTS } from '@/config/app'
import type { TvSlot } from '@/lib/routes'
import {
  addSlot,
  assignSlotClient,
  canAddSlot,
  canRemoveSlot,
  moveSlot,
  pickDefaultTvSlots,
  reconcileSlotKeys,
  removeLastSlot,
  resizeSlotKeys,
} from './tvSlots'

const slotsOf = (...ids: Array<string | null>): TvSlot[] => ids.map((clientId) => ({ clientId, day: 1 }))
const ids = (slots: TvSlot[]) => slots.map((s) => s.clientId)

describe('TV column helpers', () => {
  it('adds the next client with a routine not already shown', () => {
    expect(ids(addSlot(slotsOf('a', 'b'), ['a', 'b', 'c']))).toEqual(['a', 'b', 'c'])
  })

  it('adds an empty column when every candidate is shown', () => {
    expect(ids(addSlot(slotsOf('a'), ['a']))).toEqual(['a', null])
  })

  it('never goes above the maximum or below the minimum', () => {
    const full = slotsOf(...Array.from({ length: TV_MAX_SLOTS }, () => null))
    expect(canAddSlot(full)).toBe(false)
    expect(addSlot(full, ['z'])).toBe(full)
    const single = slotsOf(...Array.from({ length: TV_MIN_SLOTS }, () => 'a'))
    expect(canRemoveSlot(single)).toBe(false)
    expect(removeLastSlot(single)).toBe(single)
  })

  it('removes the last column', () => {
    expect(ids(removeLastSlot(slotsOf('a', 'b', 'c')))).toEqual(['a', 'b'])
  })

  it('moves columns with arrayMove semantics', () => {
    expect(ids(moveSlot(slotsOf('a', 'b', 'c', 'd'), 0, 2))).toEqual(['b', 'c', 'a', 'd'])
    expect(ids(moveSlot(slotsOf('a', 'b', 'c', 'd'), 3, 1))).toEqual(['a', 'd', 'b', 'c'])
  })

  it('ignores moves to the same or an invalid position', () => {
    const slots = slotsOf('a', 'b')
    expect(moveSlot(slots, 1, 1)).toBe(slots)
    expect(moveSlot(slots, -1, 0)).toBe(slots)
    expect(moveSlot(slots, 0, 5)).toBe(slots)
  })

  it('resets the day only when the column gets another client', () => {
    const slots: TvSlot[] = [{ clientId: 'a', day: 3 }]
    expect(assignSlotClient(slots, 0, 'a')).toBe(slots)
    expect(assignSlotClient(slots, 0, 'b')).toEqual([{ clientId: 'b', day: 1 }])
    expect(assignSlotClient(slots, 0, null)).toEqual([{ clientId: null, day: 1 }])
  })

  it('fills the default columns with clients that have a routine', () => {
    const clients = [
      { id: 'a', archived: false, currentProgramId: 'p1' },
      { id: 'b', archived: true, currentProgramId: 'p2' },
      { id: 'c', archived: false, currentProgramId: null },
      { id: 'd', archived: false, currentProgramId: 'p3' },
    ]
    expect(ids(pickDefaultTvSlots(clients))).toEqual(['a', 'd', null])
  })
})

describe('TV column keys', () => {
  it('trims from the end and appends keys not on screen', () => {
    expect(resizeSlotKeys([2, 0, 1], 2)).toEqual([2, 0])
    expect(resizeSlotKeys([2, 0], 4)).toEqual([2, 0, 3, 4])
    expect(resizeSlotKeys([], 2)).toEqual([0, 1])
  })

  it('keeps the keys while the setup matches and resizes them after an outside change', () => {
    const first = reconcileSlotKeys(null, slotsOf('a', 'b'))
    expect(first.keys).toEqual([0, 1])
    expect(reconcileSlotKeys(first, slotsOf('a', 'b'))).toBe(first)
    const moved = { serialized: reconcileSlotKeys(null, slotsOf('b', 'a')).serialized, keys: moveSlot(first.keys, 0, 1) }
    expect(reconcileSlotKeys(moved, slotsOf('b', 'a')).keys).toEqual([1, 0])
    expect(reconcileSlotKeys(moved, slotsOf('b', 'a', 'c')).keys).toEqual([1, 0, 2])
  })
})
