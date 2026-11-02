// AppData seen as rows: one row per client, program, note and library exercise, plus the branding.
// Saving, live updates and undo all work on rows, so two coaches editing different clients
// never overwrite each other. Pure functions, no React.

import { deepEqual } from '@/lib/deepEqual'
import type { AppData, Branding, Client, ClientNote, LibraryExercise, Program } from '@/types'

/** Write order: a note needs its client to exist. Deletes go in reverse. */
export const DOMAIN_TABLES = ['settings', 'library_exercises', 'clients', 'programs', 'notes'] as const
export type DomainTable = (typeof DOMAIN_TABLES)[number]

export const SETTINGS_ROW_ID = 'main'

interface RowByTable {
  settings: Branding
  library_exercises: LibraryExercise
  clients: Client
  programs: Program
  notes: ClientNote
}

export type DomainRow = RowByTable[DomainTable]

export type RowChange = {
  [T in DomainTable]: {
    table: T
    id: string
    /** null = deleted. */
    row: RowByTable[T] | null
    /** Last version known before this change; a local row that differs from it has unsaved edits. Omitted = apply anyway. */
    previous?: RowByTable[T] | null
  }
}[DomainTable]

export type RowSet = Record<DomainTable, Map<string, DomainRow>>

const byId = <T extends { id: string }>(items: readonly T[]): Map<string, DomainRow> =>
  new Map(items.map((item) => [item.id, item as unknown as DomainRow]))

function tableRows(data: AppData, table: DomainTable): Map<string, DomainRow> {
  switch (table) {
    case 'settings':
      return new Map<string, DomainRow>([[SETTINGS_ROW_ID, data.branding]])
    case 'library_exercises':
      return byId(data.library)
    case 'clients':
      return byId(data.clients)
    case 'programs':
      return byId(data.programs)
    case 'notes':
      return byId(data.notes)
  }
}

export function toRowSet(data: AppData): RowSet {
  return {
    settings: tableRows(data, 'settings'),
    library_exercises: tableRows(data, 'library_exercises'),
    clients: tableRows(data, 'clients'),
    programs: tableRows(data, 'programs'),
    notes: tableRows(data, 'notes'),
  }
}

function makeChange(table: DomainTable, id: string, row: DomainRow | null, previous: DomainRow | null): RowChange {
  return { table, id, row, previous } as RowChange
}

/** What changed from `base` to `next`: new or edited rows, and deleted ones (row: null). */
export function diffRowSets(base: RowSet, next: RowSet): RowChange[] {
  const changes: RowChange[] = []
  for (const table of DOMAIN_TABLES) {
    for (const [id, row] of next[table]) {
      const previous = base[table].get(id) ?? null
      if (!deepEqual(previous, row)) changes.push(makeChange(table, id, row, previous))
    }
    for (const [id, previous] of base[table]) {
      if (!next[table].has(id)) changes.push(makeChange(table, id, null, previous))
    }
  }
  return changes
}

export const diffData = (base: AppData, next: AppData): RowChange[] => diffRowSets(toRowSet(base), toRowSet(next))

function placeRow<T extends { id: string }>(list: T[], id: string, row: T | null): T[] {
  const index = list.findIndex((item) => item.id === id)
  if (row === null) return index < 0 ? list : list.filter((item) => item.id !== id)
  if (index < 0) return [...list, row]
  if (list[index] === row) return list
  return list.map((item, i) => (i === index ? row : item))
}

function applyRowChange(data: AppData, change: RowChange): AppData {
  switch (change.table) {
    case 'settings':
      return change.row ? { ...data, branding: change.row } : data
    case 'library_exercises':
      return { ...data, library: placeRow(data.library, change.id, change.row) }
    case 'clients':
      return { ...data, clients: placeRow(data.clients, change.id, change.row) }
    case 'programs':
      return { ...data, programs: placeRow(data.programs, change.id, change.row) }
    case 'notes':
      return { ...data, notes: placeRow(data.notes, change.id, change.row) }
  }
}

/** Returns the same object when there is nothing to apply. */
export function applyRowChanges(data: AppData, changes: readonly RowChange[]): AppData {
  return changes.reduce(applyRowChange, data)
}

/** True when this device has unsaved edits on the row: the incoming version must not replace them. */
export function hasLocalEdit(data: AppData, change: RowChange): boolean {
  if (change.previous === undefined) return false
  return !deepEqual(tableRows(data, change.table).get(change.id) ?? null, change.previous)
}
