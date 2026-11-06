// Old ?slots= links fill their screen once per device, not every time the bookmark opens (a coach who emptied the
// screen would get the same people back each morning).

import { LEGACY_TV_LINKS_REMEMBERED } from '@/features/display/config/tv'
import { DISPLAY_STORAGE_KEYS } from '@/features/display/config/display'
import { serializeTvSlots, type TvSlot } from '@/lib/routes'
import { readStorage, writeStorage } from '@/lib/safeStorage'

export const legacyLinkId = (screen: number, slots: readonly TvSlot[]): string => `${screen}|${serializeTvSlots(slots)}`

export function parseUsedLinks(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** Adds a link to the used ones, keeping only the newest LEGACY_TV_LINKS_REMEMBERED. */
export const withUsedLink = (used: readonly string[], id: string): string[] =>
  [...used.filter((other) => other !== id), id].slice(-LEGACY_TV_LINKS_REMEMBERED)

const readUsed = () => parseUsedLinks(readStorage(DISPLAY_STORAGE_KEYS.legacyLinks))

export const wasLegacyLinkUsed = (screen: number, slots: readonly TvSlot[]): boolean => readUsed().includes(legacyLinkId(screen, slots))

export function rememberLegacyLink(screen: number, slots: readonly TvSlot[]): void {
  writeStorage(DISPLAY_STORAGE_KEYS.legacyLinks, JSON.stringify(withUsedLink(readUsed(), legacyLinkId(screen, slots))))
}
