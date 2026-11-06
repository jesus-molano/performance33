// Local test mode: screens and sections in this browser, with the same rules as the cloud tables
// (a section needs its screen, a removed screen takes its sections). Other windows hear of changes by the storage event.

import { STORAGE_KEYS } from '@/config/app'
import type { ScreensSnapshot } from '@/features/screens/types'
import { sectionId, toSectionMap } from '@/features/screens/utils/sections'
import { createLocalPresence } from './localPresence'
import { readSnapshot, writeSnapshot } from './snapshotStorage'
import type { ScreensService } from './types'

const KEY = STORAGE_KEYS.screens

const read = (): ScreensSnapshot => readSnapshot(KEY) ?? { screens: [], sections: [] }

function update(change: (snapshot: ScreensSnapshot) => ScreensSnapshot): void {
  writeSnapshot(KEY, change(read()))
}

export function createLocalScreens(): ScreensService {
  return {
    load: async () => read(),

    saveScreens: async (screens, onlyNew = false) =>
      update((current) => {
        const existing = new Set(current.screens.map((s) => s.id))
        const incoming = onlyNew ? screens.filter((s) => !existing.has(s.id)) : screens
        const merged = new Map([...current.screens, ...incoming].map((s) => [s.id, s]))
        return { ...current, screens: [...merged.values()].sort((a, b) => a.id - b.id) }
      }),

    removeScreen: async (id) =>
      update((current) => ({ screens: current.screens.filter((s) => s.id !== id), sections: current.sections.filter((s) => s.screen !== id) })),

    saveSections: async (sections) => {
      const current = read()
      if (sections.some((section) => !current.screens.some((s) => s.id === section.screen))) throw new Error('Missing screen')
      writeSnapshot(KEY, { ...current, sections: Object.values({ ...toSectionMap(current.sections), ...toSectionMap(sections) }) })
    },

    removeSections: async (ids) => update((current) => ({ ...current, sections: current.sections.filter((s) => !ids.includes(sectionId(s))) })),

    subscribe(_onEvent, onMissed) {
      const onStorage = (event: StorageEvent) => {
        if (event.key === KEY) onMissed()
      }
      window.addEventListener('storage', onStorage)
      return () => window.removeEventListener('storage', onStorage)
    },

    presence: createLocalPresence(),
  }
}
