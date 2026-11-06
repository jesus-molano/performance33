// Local test mode: screens and sections in this browser, with the same rules as the cloud tables
// (a section needs its screen, a removed screen takes its sections). Other windows hear of changes by the storage event.

import { STORAGE_KEYS } from '@/config/app'
import type { ScreensSnapshot } from '@/features/screens/types'
import { sectionsAfterResize } from '@/features/screens/utils/sectionLimits'
import { toSectionMap } from '@/features/screens/utils/sections'
import { readSnapshot, writeSnapshot } from './snapshotStorage'
import type { ScreenPresence, ScreensService } from './types'

const KEY = STORAGE_KEYS.screens

const read = (): ScreensSnapshot => readSnapshot(KEY) ?? { screens: [], sections: [] }

function update(change: (snapshot: ScreensSnapshot) => ScreensSnapshot): void {
  writeSnapshot(KEY, change(read()))
}

/** `presence`: the TV windows of this browser (the only ones there are in test mode). */
export function createLocalScreens(presence: ScreenPresence): ScreensService {
  return {
    load: async () => read(),

    saveScreens: async (screens, onlyNew = false) =>
      update((current) => {
        const existing = new Set(current.screens.map((s) => s.id))
        const incoming = onlyNew ? screens.filter((s) => !existing.has(s.id)) : screens
        const merged = new Map([...current.screens, ...incoming].map((s) => [s.id, s]))
        const next = [...merged.values()].sort((a, b) => a.id - b.id)
        return { screens: next, sections: sectionsAfterResize(current.sections, current.screens, next) }
      }),

    removeScreen: async (id) =>
      update((current) => ({ screens: current.screens.filter((s) => s.id !== id), sections: current.sections.filter((s) => s.screen !== id) })),

    saveSections: async (sections) => {
      const current = read()
      if (sections.some((section) => !current.screens.some((s) => s.id === section.screen))) throw new Error('Missing screen')
      writeSnapshot(KEY, { ...current, sections: Object.values({ ...toSectionMap(current.sections), ...toSectionMap(sections) }) })
    },

    subscribe(_onEvent, onMissed) {
      const onStorage = (event: StorageEvent) => {
        if (event.key === KEY) onMissed()
      }
      window.addEventListener('storage', onStorage)
      return () => window.removeEventListener('storage', onStorage)
    },

    presence,
  }
}
