// Screens and sections kept in localStorage as the same rows as the cloud tables (local test mode, and the cloud's cache).

import type { ScreensSnapshot } from '@/features/screens/types'
import { screensFromRows, screenToRow, sectionsFromRows, sectionToRow, type RawRow } from '@/features/screens/utils/rows'
import { readStorage, writeStorage } from '@/lib/safeStorage'

interface StoredRows {
  screens?: RawRow[]
  sections?: RawRow[]
}

export function readSnapshot(key: string): ScreensSnapshot | null {
  const raw = readStorage(key)
  if (!raw) return null
  try {
    const stored = JSON.parse(raw) as StoredRows
    return { screens: screensFromRows(stored.screens ?? []), sections: sectionsFromRows(stored.sections ?? []) }
  } catch {
    return null
  }
}

export function writeSnapshot(key: string, snapshot: ScreensSnapshot): void {
  const stored: StoredRows = { screens: snapshot.screens.map(screenToRow), sections: snapshot.sections.map(sectionToRow) }
  writeStorage(key, JSON.stringify(stored))
}
