// Screens and sections in the cloud tables, followed live. Only screen numbers, names, client ids and days travel.

import type { SupabaseClient } from '@supabase/supabase-js'
import { STORAGE_KEYS } from '@/config/app'
import { SCREENS_CHANNEL, SCREENS_COLUMNS, SCREENS_TABLES, type ScreensTable } from '@/features/screens/config/screens'
import type { ScreensEvent } from '@/features/screens/types'
import { screenFromRow, screensFromRows, screenToRow, sectionFromRow, sectionsFromRows, sectionToRow, type RawRow } from '@/features/screens/utils/rows'
import { removeStorage } from '@/lib/safeStorage'
import { deleteTableRows, fetchTableRows, subscribeTableRows, upsertTableRows, type TableEvent } from '@/persistence/supabaseGateway'
import { createCloudPresence } from './cloudPresence'
import { readSnapshot, writeSnapshot } from './snapshotStorage'
import type { ScreensService } from './types'

/** A live change as the store reads it; null when the row is not valid (then the screens are reloaded). */
export function toScreensEvent({ table, id, row }: TableEvent<ScreensTable, RawRow>): ScreensEvent | null {
  if (table === SCREENS_TABLES.screens) {
    const screen = row ? screenFromRow(row) : null
    if (row && !screen) return null
    return { kind: 'screen', id: Number(id), screen }
  }
  const section = row ? sectionFromRow(row) : null
  if (row && !section) return null
  return { kind: 'section', id, section }
}

export function createCloudScreens(client: SupabaseClient): ScreensService {
  const fetchRows = (table: ScreensTable) => fetchTableRows<RawRow>(client, table, SCREENS_COLUMNS[table])

  return {
    async load() {
      const [screens, sections] = await Promise.all([fetchRows(SCREENS_TABLES.screens), fetchRows(SCREENS_TABLES.sections)])
      return { screens: screensFromRows(screens), sections: sectionsFromRows(sections) }
    },

    saveScreens: (screens, onlyNew = false) => upsertTableRows(client, SCREENS_TABLES.screens, screens.map(screenToRow), onlyNew),

    removeScreen: async (id) => {
      await deleteTableRows(client, SCREENS_TABLES.screens, [String(id)])
    },

    saveSections: (sections) => upsertTableRows(client, SCREENS_TABLES.sections, sections.map(sectionToRow)),

    subscribe: (onEvent, onMissed) =>
      subscribeTableRows<ScreensTable, RawRow>(
        client,
        SCREENS_CHANNEL,
        [SCREENS_TABLES.screens, SCREENS_TABLES.sections],
        (event) => {
          const change = toScreensEvent(event)
          if (change) onEvent(change)
          else onMissed()
        },
        onMissed,
      ),

    presence: createCloudPresence(client),

    cache: {
      read: () => readSnapshot(STORAGE_KEYS.screensCache),
      write: (snapshot) => writeSnapshot(STORAGE_KEYS.screensCache, snapshot),
      clear: () => removeStorage(STORAGE_KEYS.screensCache),
    },
  }
}
