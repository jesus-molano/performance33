import { TV_MAX_SECTIONS, TV_MIN_SECTIONS } from '@/config/app'
import { moveItem } from '@/lib/arrays'
import { parseLegacyTvSlots, serializeTvSlots, type TvSlot } from '@/lib/routes'
import { readStorage, removeStorage } from '@/lib/safeStorage'
import type { Client, DisplayData } from '@/types'
import { tvSlotsKey } from './tvScreens'

export const isEmptySlotSet = (slots: readonly TvSlot[]): boolean => slots.every((s) => !s.clientId)

/** Setup of this screen that older versions kept on this device (column count included), or null. */
export function loadStoredSlots(screen: number): TvSlot[] | null {
  const slots = parseLegacyTvSlots(readStorage(tvSlotsKey(screen)))
  return slots && !isEmptySlotSet(slots) ? slots : null
}

export function forgetStoredSlots(screen: number): void {
  removeStorage(tvSlotsKey(screen))
}

export function replaceSlot(slots: TvSlot[], index: number, patch: Partial<TvSlot>): TvSlot[] {
  return slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot))
}

/** Puts a client in a column (day 1); picking the client it already shows keeps its day. */
export function assignSlotClient(slots: TvSlot[], index: number, clientId: string | null): TvSlot[] {
  if (slots[index]?.clientId === clientId) return slots
  return replaceSlot(slots, index, { clientId, day: 1 })
}

export const canAddSlot = (slots: readonly TvSlot[]): boolean => slots.length < TV_MAX_SECTIONS
export const canRemoveSlot = (slots: readonly TvSlot[]): boolean => slots.length > TV_MIN_SECTIONS

/** Appends a column with the first candidate client not already on screen (or empty). */
export function addSlot(slots: TvSlot[], candidateClientIds: readonly string[]): TvSlot[] {
  if (!canAddSlot(slots)) return slots
  const next = candidateClientIds.find((id) => !slots.some((s) => s.clientId === id)) ?? null
  return [...slots, { clientId: next, day: 1 }]
}

/** Drops the last column (never below TV_MIN_SECTIONS). */
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
 * positions change on a move), tied to the setup they were computed for.
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

/** Keys for the current slots: unchanged when they match, resized after a change from elsewhere. */
export function reconcileSlotKeys(previous: TvSlotKeys | null, slots: readonly TvSlot[]): TvSlotKeys {
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

/** First names on a screen, for the 'Pantallas' menu ('Laura, Javier'), without repeats. */
export function describeScreenClients(slots: readonly Pick<TvSlot, 'clientId'>[] | null, clients: readonly Pick<Client, 'id' | 'firstName'>[]): string {
  const names = (slots ?? []).flatMap((slot) => clients.find((c) => c.id === slot.clientId)?.firstName ?? [])
  return [...new Set(names)].join(', ')
}
