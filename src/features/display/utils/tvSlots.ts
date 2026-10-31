import { TV_SLOT_COUNT } from '@/config/app'
import { parseTvSlots, serializeTvSlots, type TvSlot } from '@/lib/routes'
import type { Client, DisplayData, PublicClient } from '@/types'
import { DISPLAY_STORAGE_KEYS } from '@/features/display/config/display'
import { readStorage, writeStorage } from '@/lib/safeStorage'

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

/** The first clients with a current routine fill the TV thirds (day 1); the rest stay empty. */
export function pickDefaultTvSlots(clients: readonly Pick<Client, 'id' | 'archived' | 'currentProgramId'>[]): TvSlot[] {
  const withRoutine = clients.filter((c) => !c.archived && c.currentProgramId)
  return Array.from({ length: TV_SLOT_COUNT }, (_, i) => ({ clientId: withRoutine[i]?.id ?? null, day: 1 }))
}

/** Slots for the 'Pantallas' button: the setup last used on this device, else the defaults. */
export function initialTvSlots(clients: readonly Pick<Client, 'id' | 'archived' | 'currentProgramId'>[]): TvSlot[] {
  return loadStoredSlots() ?? pickDefaultTvSlots(clients)
}
