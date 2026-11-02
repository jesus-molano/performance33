import { TV_DEFAULT_SLOTS, TV_MAX_SLOTS, TV_MIN_SLOTS } from '@/config/app'
import { moveItem } from '@/lib/arrays'
import { parseTvSlots, serializeTvSlots, type TvSlot } from '@/lib/routes'
import type { Client, DisplayData } from '@/types'
import { tvSlotsKey } from './tvScreens'
import { readStorage, writeStorage } from '@/lib/safeStorage'

export const isEmptySlotSet = (slots: TvSlot[]): boolean => slots.every((s) => !s.clientId)

/** Last setup of this screen saved on this device (column count included), or null. */
export function loadStoredSlots(screen: number): TvSlot[] | null {
  const raw = readStorage(tvSlotsKey(screen))
  if (raw == null) return null
  const slots = parseTvSlots(raw)
  return isEmptySlotSet(slots) ? null : slots
}

export function storeSlots(screen: number, slots: TvSlot[]): void {
  writeStorage(tvSlotsKey(screen), serializeTvSlots(slots))
}

export function replaceSlot(slots: TvSlot[], index: number, patch: Partial<TvSlot>): TvSlot[] {
  return slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot))
}

/** Puts a client in a column (day 1); picking the client it already shows keeps its day. */
export function assignSlotClient(slots: TvSlot[], index: number, clientId: string | null): TvSlot[] {
  if (slots[index]?.clientId === clientId) return slots
  return replaceSlot(slots, index, { clientId, day: 1 })
}

export const canAddSlot = (slots: TvSlot[]): boolean => slots.length < TV_MAX_SLOTS
export const canRemoveSlot = (slots: TvSlot[]): boolean => slots.length > TV_MIN_SLOTS

/** Appends a column with the first candidate client not already on screen (or empty). */
export function addSlot(slots: TvSlot[], candidateClientIds: readonly string[]): TvSlot[] {
  if (!canAddSlot(slots)) return slots
  const next = candidateClientIds.find((id) => !slots.some((s) => s.clientId === id)) ?? null
  return [...slots, { clientId: next, day: 1 }]
}

/** Drops the last column (never below TV_MIN_SLOTS). */
export function removeLastSlot(slots: TvSlot[]): TvSlot[] {
  return canRemoveSlot(slots) ? slots.slice(0, -1) : slots
}

/** arrayMove semantics (columns and their keys); out-of-range indexes leave the list untouched. */
export function moveSlot<T>(slots: T[], from: number, to: number): T[] {
  const inRange = (i: number) => i >= 0 && i < slots.length
  if (from === to || !inRange(from) || !inRange(to)) return slots
  return moveItem(slots, from, to)
}

/**
 * Session keys that follow each column when it is moved, added or removed (client ids can repeat and
 * positions change on a move), tied to the URL setup they were computed for.
 */
export interface TvSlotKeys {
  serialized: string
  keys: number[]
}

/** Trims keys from the end or appends fresh ones (never reusing a key still on screen). */
export function resizeSlotKeys(keys: readonly number[], count: number): number[] {
  if (keys.length >= count) return keys.slice(0, count)
  const first = keys.length ? Math.max(...keys) + 1 : 0
  return [...keys, ...Array.from({ length: count - keys.length }, (_, i) => first + i)]
}

/** Keys for the current slots: unchanged when they match, resized after an outside URL change. */
export function reconcileSlotKeys(previous: TvSlotKeys | null, slots: TvSlot[]): TvSlotKeys {
  const serialized = serializeTvSlots(slots)
  if (previous?.serialized === serialized) return previous
  return { serialized, keys: resizeSlotKeys(previous?.keys ?? [], slots.length) }
}

/** Sortable id (and React key) of a column. */
export const tvSlotSortId = (key: number): string => `tv-slot-${key}`

/** First name of a public client (for empty states), or null. */
export function findClientFirstName(data: DisplayData | null, clientId: string | null): string | null {
  if (!data || !clientId) return null
  return data.clients.find((c) => c.id === clientId)?.firstName ?? null
}

type SlotClient = Pick<Client, 'id' | 'archived' | 'currentProgramId'>

/** The first clients with a current routine, not already on another screen, fill the columns (day 1); the rest stay empty. */
export function pickDefaultTvSlots(clients: readonly SlotClient[], takenClientIds: readonly string[] = []): TvSlot[] {
  const withRoutine = clients.filter((c) => !c.archived && c.currentProgramId && !takenClientIds.includes(c.id))
  return Array.from({ length: TV_DEFAULT_SLOTS }, (_, i) => ({ clientId: withRoutine[i]?.id ?? null, day: 1 }))
}

/** Slots to open a screen with: its setup last used on this device, else the clients the other screens are not showing. */
export function initialTvSlots(screen: number, otherScreens: readonly number[], clients: readonly SlotClient[]): TvSlot[] {
  const taken = otherScreens.flatMap((other) => (loadStoredSlots(other) ?? []).flatMap((slot) => slot.clientId ?? []))
  return loadStoredSlots(screen) ?? pickDefaultTvSlots(clients, taken)
}

/** First names on a screen, for the 'Pantallas' menu ('Laura, Javier'), without repeats. */
export function describeScreenClients(slots: readonly TvSlot[] | null, clients: readonly Pick<Client, 'id' | 'firstName'>[]): string {
  const names = (slots ?? []).flatMap((slot) => clients.find((c) => c.id === slot.clientId)?.firstName ?? [])
  return [...new Set(names)].join(', ')
}
