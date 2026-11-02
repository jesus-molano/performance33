// What SupabaseRepository needs from the server. Separate so its logic can be tested with a fake.

import type { DomainTable } from '@/lib/dataRows'
import type { DbRow } from './dbRows'

/** The server refused the write for good (no permission, invalid data): retrying will not help. */
export class PermanentWriteError extends Error {}

export interface RowEvent {
  table: DomainTable
  id: string
  /** null = deleted. */
  row: DbRow | null
}

export interface RowGateway {
  fetchAll(table: DomainTable): Promise<DbRow[]>
  /** True until seedLibrary works, and only for an administrator: the initial library has to be uploaded. */
  librarySeedPending(): Promise<boolean>
  /** Uploads the initial library in one transaction on the server: whole or not at all, never over an existing id, never twice. */
  seedLibrary(rows: DbRow[]): Promise<void>
  /** Throws PermanentWriteError when refused, any other error when it may work later. */
  upsert(table: DomainTable, rows: DbRow[]): Promise<void>
  /** Returns the ids actually deleted (the access rules silently skip the others). */
  remove(table: DomainTable, ids: string[]): Promise<string[]>
  /** `onMissed`: events may have been lost (reconnected, event too big): reload to catch up. Only these tables, when given. */
  subscribe(onEvent: (event: RowEvent) => void, onMissed: () => void, tables?: readonly DomainTable[]): () => void
}
