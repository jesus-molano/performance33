// Translation between app rows and database rows (pure, no network).

import { DEFAULT_BRANDING } from '@/config/branding'
import { createEmptyData } from '@/lib/factories'
import { applyRowChanges, DOMAIN_TABLES, type DomainRow, type DomainTable, type RowChange } from '@/lib/dataRows'
import type { AppData, ClientNote, CustomExercise } from '@/types'
import { normalizeBranding, normalizeClient, normalizeNote, normalizeProgram } from './migrate'

/** A row as the database stores it. */
export interface DbRow {
  id: string
  data: unknown
  client_origin?: string | null
  /** notes only */
  author_staff_id?: string | null
  /** notes only */
  client_id?: string
}

/** The columns are the truth for a note's author and client: they are what the access rules check. */
function noteFromDb(raw: DbRow): ClientNote {
  const data = (raw.data ?? {}) as Partial<ClientNote>
  return normalizeNote({
    ...data,
    id: raw.id,
    authorId: raw.author_staff_id ?? '',
    clientId: raw.client_id ?? data.clientId ?? '',
  })
}

export function rowFromDb(table: DomainTable, raw: DbRow): DomainRow {
  const data = { ...((raw.data ?? {}) as object), id: raw.id }
  switch (table) {
    case 'settings':
      return normalizeBranding(raw.data)
    case 'library_exercises':
      return data as unknown as CustomExercise
    case 'clients':
      return normalizeClient(data)
    case 'programs':
      return normalizeProgram(data)
    case 'notes':
      return noteFromDb(raw)
  }
}

export function rowToDb(change: RowChange & { row: DomainRow }, origin: string): DbRow {
  const base: DbRow = { id: change.id, data: change.row, client_origin: origin }
  if (change.table !== 'notes') return base
  const note = change.row as ClientNote
  return { ...base, author_staff_id: note.authorId || null, client_id: note.clientId }
}

/** Whole dataset from every table's rows. Without a settings row the branding is the default one. */
export function appDataFromDb(rowsByTable: Record<DomainTable, DbRow[]>): AppData {
  const changes = DOMAIN_TABLES.flatMap((table) =>
    rowsByTable[table].map((raw) => ({ table, id: raw.id, row: rowFromDb(table, raw) }) as RowChange),
  )
  return applyRowChanges({ ...createEmptyData(), branding: { ...DEFAULT_BRANDING } }, changes)
}
