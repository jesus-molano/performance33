import { parseTvSlots, serializeTvSlots, type TvSlot } from '../../../lib/routes'
import type { DisplayData, PublicClient } from '../../../types'
import { DISPLAY_STORAGE_KEYS } from '../config/display'
import { readStorage, writeStorage } from './storage'

export const isEmptySlotSet = (slots: TvSlot[]): boolean => slots.every((s) => !s.clientId)

/** Last TV setup saved on this device, or null. */
export function loadStoredSlots(): TvSlot[] | null {
  const raw = readStorage(DISPLAY_STORAGE_KEYS.tvSlots)
  if (raw == null) return null
  const slots = parseTvSlots(raw)
  return isEmptySlotSet(slots) ? null : slots
}

export function storeSlots(slots: TvSlot[]): void {
  writeStorage(DISPLAY_STORAGE_KEYS.tvSlots, serializeTvSlots(slots))
}

export function replaceSlot(slots: TvSlot[], index: number, patch: Partial<TvSlot>): TvSlot[] {
  return slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot))
}

/** First name of a public client (for empty states), or null. */
export function findClientFirstName(data: DisplayData | null, clientId: string | null): string | null {
  if (!data || !clientId) return null
  return data.clients.find((c) => c.id === clientId)?.firstName ?? null
}

/** Picker options for a third: the displayable clients plus the selected one if it lost its routine. */
export function withSelectedClient(
  clients: PublicClient[],
  data: DisplayData | null,
  clientId: string | null,
): PublicClient[] {
  if (!data || !clientId || clients.some((c) => c.id === clientId)) return clients
  const selected = data.clients.find((c) => c.id === clientId)
  return selected ? [selected, ...clients] : clients
}
