// Applying what the server says (a reload or one live change) to what this window shows, minus its own pending writes.

import type { ScreenConfig, ScreenSection, ScreensEvent, ScreensSnapshot, SectionMap } from '@/features/screens/types'
import { screenKey, sectionKey } from './pendingWrites'
import { sectionId, toSectionMap, upsertScreen, withoutSections } from './sections'

export interface ScreensData {
  screens: ScreenConfig[]
  sections: SectionMap
}

type Accept = (key: string, value: unknown) => boolean

const byScreenId = (screens: readonly ScreenConfig[]) => new Map(screens.map((s) => [s.id, s]))

/** Server rows win, except where this window wrote something the server has not confirmed yet. */
export function mergeSnapshot(local: ScreensData, server: ScreensSnapshot, accept: Accept): ScreensData {
  const localScreens = byScreenId(local.screens)
  const serverScreens = byScreenId(server.screens)
  const screens = [...new Set([...localScreens.keys(), ...serverScreens.keys()])]
    .flatMap((id) => {
      const incoming = serverScreens.get(id) ?? null
      return (accept(screenKey(id), incoming) ? incoming : localScreens.get(id)) ?? []
    })
    .sort((a, b) => a.id - b.id)

  const serverSections = toSectionMap(server.sections)
  const ids = new Set([...Object.keys(local.sections), ...Object.keys(serverSections)])
  const sections: Record<string, ScreenSection> = {}
  for (const id of ids) {
    const incoming = serverSections[id] ?? null
    const kept = accept(sectionKey(id), incoming) ? incoming : (local.sections[id] ?? null)
    if (kept) sections[id] = kept
  }
  return { screens, sections }
}

/** One live change; a removed screen takes its sections with it, as on the server. */
export function applyEvent(local: ScreensData, event: ScreensEvent, accept: Accept): ScreensData {
  if (event.kind === 'screen') {
    if (!accept(screenKey(event.id), event.screen)) return local
    if (event.screen) return { ...local, screens: upsertScreen(local.screens, event.screen) }
    const gone = Object.values(local.sections).filter((s) => s.screen === event.id).map(sectionId)
    return { screens: local.screens.filter((s) => s.id !== event.id), sections: withoutSections(local.sections, gone) }
  }
  if (!accept(sectionKey(event.id), event.section)) return local
  if (event.section) return { ...local, sections: { ...local.sections, [event.id]: event.section } }
  return { ...local, sections: withoutSections(local.sections, [event.id]) }
}
