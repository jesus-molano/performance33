// RowGateway over the Supabase client.

import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js'
import { CLOUD_PAGE_SIZE } from '@/config/app'
import { DOMAIN_TABLES, type DomainTable } from '@/lib/dataRows'
import type { DbRow } from './dbRows'
import { uniqueChannelTopic } from './tabId'
import { PermanentWriteError, type RowEvent, type RowGateway } from './rowGateway'

const COLUMNS: Record<DomainTable, string> = {
  settings: 'id,data',
  library_exercises: 'id,data',
  clients: 'id,data',
  programs: 'id,data',
  notes: 'id,data,author_profile_id,client_id',
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

export function createSupabaseGateway(client: SupabaseClient): RowGateway {
  return {
    async fetchAll(table) {
      const rows: DbRow[] = []
      for (let from = 0; ; from += CLOUD_PAGE_SIZE) {
        const { data, error } = await client
          .from(table)
          .select(COLUMNS[table])
          .order('id')
          .range(from, from + CLOUD_PAGE_SIZE - 1)
        if (error) throw new Error(error.message)
        rows.push(...(data as unknown as DbRow[]))
        if (data.length < CLOUD_PAGE_SIZE) return rows
      }
    },

    async upsert(table, rows) {
      const { error } = await client.from(table).upsert(rows, { onConflict: 'id' })
      if (error) throwWriteError(error)
    },

    async librarySeedPending() {
      const { data, error } = await client.rpc('library_seed_pending')
      if (error) throw new Error(error.message)
      return data === true
    },

    async seedLibrary(rows) {
      const { error } = await client.rpc('seed_library', { p_rows: rows })
      if (error) throw new Error(error.message)
    },

    async remove(table, ids) {
      const { data, error } = await client.from(table).delete().in('id', ids).select('id')
      if (error) throwWriteError(error)
      return (data ?? []).map((row) => String(row.id))
    },

    subscribe(onEvent, onMissed, tables = DOMAIN_TABLES) {
      const toEvent = (table: DomainTable, payload: Payload): RowEvent | null => {
        if (payload.errors?.length) return null
        if (payload.eventType === 'DELETE') {
          const id = payload.old.id
          return typeof id === 'string' ? { table, id, row: null } : null
        }
        const row = payload.new as unknown as DbRow
        return row.data ? { table, id: row.id, row } : null
      }
      const channel = tables.reduce(
        (builder, table) =>
          builder.on('postgres_changes', { event: '*', schema: 'public', table }, (payload: Payload) => {
            const event = toEvent(table, payload)
            if (event) onEvent(event)
            else onMissed()
          }),
        client.channel(uniqueChannelTopic('p33-rows')),
      )
      // Also on the first connection: it closes the gap since the data was loaded.
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') onMissed()
      })
      return () => void client.removeChannel(channel)
    },
  }
}
