// RowGateway over the Supabase client, on top of table helpers that other features (TV screens) use for their own tables.

import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js'
import { CLOUD_PAGE_SIZE } from '@/config/app'
import { DOMAIN_TABLES, type DomainTable } from '@/lib/dataRows'
import type { DbRow } from './dbRows'
import { uniqueChannelTopic } from './tabId'
import { PermanentWriteError, type RowGateway } from './rowGateway'

const COLUMNS: Record<DomainTable, string> = {
  settings: 'id,data',
  library_exercises: 'id,data',
  clients: 'id,data',
  programs: 'id,data',
  notes: 'id,data,author_profile_id,client_id',
}

/** A row of a table with an `id` text key and a `data` jsonb (its other columns, as read). */
export interface TableRow {
  id: string
  data?: unknown
}

/** A live change of one row: null = deleted. */
export interface TableEvent<T extends string, R extends TableRow> {
  table: T
  id: string
  row: R | null
}

interface DbError {
  code?: string
  message: string
}

/** Postgres classes for refused or invalid data. Network errors have no code; expired sessions recover on their own. */
const PERMANENT_ERROR = /^(22|23|42|P0)/

export function isPermanentWriteError(error: DbError): boolean {
  return PERMANENT_ERROR.test(error.code ?? '')
}

function throwWriteError(error: DbError): never {
  if (isPermanentWriteError(error)) throw new PermanentWriteError(error.message)
  throw new Error(error.message)
}

type Payload = RealtimePostgresChangesPayload<Record<string, unknown>>

/** Every row of a table, page by page, in id order. */
export async function fetchTableRows<R extends TableRow>(client: SupabaseClient, table: string, columns: string): Promise<R[]> {
  const rows: R[] = []
  for (let from = 0; ; from += CLOUD_PAGE_SIZE) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .order('id')
      .range(from, from + CLOUD_PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data as unknown as R[]))
    if (data.length < CLOUD_PAGE_SIZE) return rows
  }
}

/** Throws PermanentWriteError when refused. `ignoreDuplicates`: an existing id is left as it is (insert only if new). */
export async function upsertTableRows(client: SupabaseClient, table: string, rows: TableRow[], ignoreDuplicates = false): Promise<void> {
  const { error } = await client.from(table).upsert(rows, { onConflict: 'id', ignoreDuplicates })
  if (error) throwWriteError(error)
}

/** Returns the ids actually deleted (the access rules silently skip the others). */
export async function deleteTableRows(client: SupabaseClient, table: string, ids: string[]): Promise<string[]> {
  const { data, error } = await client.from(table).delete().in('id', ids).select('id')
  if (error) throwWriteError(error)
  return (data ?? []).map((row) => String(row.id))
}

export function toTableEvent<T extends string, R extends TableRow>(table: T, payload: Payload): TableEvent<T, R> | null {
  if (payload.errors?.length) return null
  if (payload.eventType === 'DELETE') {
    const id = payload.old.id
    return typeof id === 'string' ? { table, id, row: null } : null
  }
  const row = payload.new as unknown as R
  return row.data ? { table, id: row.id, row } : null
}

/**
 * Follows row changes of these tables on a channel of its own (see uniqueChannelTopic). `onMissed`: events may have been
 * lost (connected or reconnected, an event too big to carry its row): reload to catch up.
 */
export function subscribeTableRows<T extends string, R extends TableRow>(
  client: SupabaseClient,
  name: string,
  tables: readonly T[],
  onEvent: (event: TableEvent<T, R>) => void,
  onMissed: () => void,
): () => void {
  const channel = tables.reduce(
    (builder, table) =>
      builder.on('postgres_changes', { event: '*', schema: 'public', table }, (payload: Payload) => {
        const event = toTableEvent<T, R>(table, payload)
        if (event) onEvent(event)
        else onMissed()
      }),
    client.channel(uniqueChannelTopic(name)),
  )
  // Also on the first connection: it closes the gap since the data was loaded.
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') onMissed()
  })
  return () => void client.removeChannel(channel)
}

export function createSupabaseGateway(client: SupabaseClient): RowGateway {
  return {
    fetchAll: (table) => fetchTableRows<DbRow>(client, table, COLUMNS[table]),

    upsert: (table, rows) => upsertTableRows(client, table, rows),

    async librarySeedPending() {
      const { data, error } = await client.rpc('library_seed_pending')
      if (error) throw new Error(error.message)
      return data === true
    },

    async seedLibrary(rows) {
      const { error } = await client.rpc('seed_library', { p_rows: rows })
      if (error) throw new Error(error.message)
    },

    remove: (table, ids) => deleteTableRows(client, table, ids),

    subscribe: (onEvent, onMissed, tables = DOMAIN_TABLES) => subscribeTableRows<DomainTable, DbRow>(client, 'p33-rows', tables, onEvent, onMissed),
  }
}
