// Sessions in the cloud: staff read the table; only the screen trigger of schema.sql writes it. Any live change reloads.

import type { SupabaseClient } from '@supabase/supabase-js'
import { SESSION_COLUMNS, SESSION_TABLE, sessionFromRow, type TrainingSessionRow } from '@shared/routine'
import { fetchTableRows, subscribeTableRows } from '@/persistence/supabaseGateway'
import { SESSIONS_CHANNEL } from '@/features/sessions/config/sessions'
import type { SessionsService } from './types'

export function createCloudSessions(client: SupabaseClient): SessionsService {
  return {
    // Page by page: more than one page of sessions in SESSION_READ_DAYS is normal for a busy gym.
    load: async (from) =>
      (await fetchTableRows<TrainingSessionRow>(client, SESSION_TABLE, SESSION_COLUMNS, { column: 'gym_date', value: from })).map(sessionFromRow),
    subscribe: (onChange) => subscribeTableRows(client, SESSIONS_CHANNEL, [SESSION_TABLE], onChange, onChange),
  }
}
