// Screens and sections as table rows (the cloud tables, and the same rows in local test mode). Reads accept anything
// and keep only valid rows, normalised.

import type { ScreenConfig, ScreenSection } from '@/features/screens/types'
import { defaultScreenName, isValidScreenId, normalizeScreen, parseSectionId } from './sections'

/** A row as stored: `id` text plus a `data` object (sections also carry `screen_id`). */
export interface RawRow {
  id: string
  data?: unknown
  screen_id?: unknown
}

export interface ScreenRow {
  id: string
  data: { name: string; sections: number }
}

export interface SectionRow {
  id: string
  screen_id: string
  data: { clientId: string | null; day: number; assignedAt: string }
}

const asRecord = (data: unknown): Record<string, unknown> => (data && typeof data === 'object' ? (data as Record<string, unknown>) : {})

export const screenToRow = ({ id, name, sections }: ScreenConfig): ScreenRow => ({ id: String(id), data: { name, sections } })

export function screenFromRow(raw: RawRow): ScreenConfig | null {
  const id = Number(raw.id)
  if (!isValidScreenId(id)) return null
  const data = asRecord(raw.data)
  return normalizeScreen({
    id,
    name: typeof data.name === 'string' ? data.name : defaultScreenName(id),
    sections: typeof data.sections === 'number' ? data.sections : Number.NaN,
  })
}

export const sectionToRow = ({ screen, section, clientId, day, assignedAt }: ScreenSection): SectionRow => ({
  id: `${screen}:${section}`,
  screen_id: String(screen),
  data: { clientId, day, assignedAt },
})

export function sectionFromRow(raw: RawRow): ScreenSection | null {
  const ref = parseSectionId(raw.id)
  if (!ref) return null
  const data = asRecord(raw.data)
  const day = Number(data.day)
  return {
    ...ref,
    clientId: typeof data.clientId === 'string' && data.clientId ? data.clientId : null,
    day: Number.isInteger(day) && day >= 1 ? day : 1,
    assignedAt: typeof data.assignedAt === 'string' ? data.assignedAt : '',
  }
}

export const screensFromRows = (rows: readonly RawRow[]): ScreenConfig[] =>
  rows.flatMap((row) => screenFromRow(row) ?? []).sort((a, b) => a.id - b.id)

export const sectionsFromRows = (rows: readonly RawRow[]): ScreenSection[] => rows.flatMap((row) => sectionFromRow(row) ?? [])
