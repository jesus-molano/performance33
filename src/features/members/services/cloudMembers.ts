// Members' app accounts in the cloud: the team reads `members` (never the hash) and changes them only through the
// member-accounts function, which checks that the caller is an active coach.

import type { SupabaseClient } from '@supabase/supabase-js'
import { MEMBER_COLUMNS, MEMBERS_TABLE, type MemberRow } from '@shared/booking'
import { invokeFunction } from '@/auth'
import { CONNECTION_MESSAGE } from '@/lib/accountMessages'
import { uniqueChannelTopic } from '@/persistence/tabId'
import { MEMBERS_CHANNEL } from '@/features/members/config/memberApp'
import type { MemberCredentials } from '@/features/members/types'
import { memberAccessFromRow } from '@/features/members/utils/access'
import { memberErrorMessage } from '@/features/members/utils/messages'
import type { MemberAccessService } from './types'

const MEMBER_FUNCTION = 'member-accounts'

export function createCloudMembers(client: SupabaseClient): MemberAccessService {
  const call = <T>(action: string, fields: object) => invokeFunction<T>(client, MEMBER_FUNCTION, { action, ...fields }, memberErrorMessage)

  return {
    async load(clientId) {
      const { data, error } = await client.from(MEMBERS_TABLE).select(MEMBER_COLUMNS).eq('client_id', clientId).maybeSingle()
      if (error) throw new Error(CONNECTION_MESSAGE)
      return data ? memberAccessFromRow(data as MemberRow) : null
    },
    give: (clientId, input) => call<MemberCredentials>('invite', { clientId, ...input }),
    resetPassword: (clientId) => call<MemberCredentials>('reset-password', { clientId }),
    setActive: async (clientId, active) => void (await call('set-active', { clientId, active })),
    remove: async (clientId) => void (await call('remove', { clientId })),
    subscribe(listener) {
      // Unfiltered: a delete only carries the row id, so a filter on client_id would miss it.
      const channel = client
        .channel(uniqueChannelTopic(MEMBERS_CHANNEL))
        .on('postgres_changes', { event: '*', schema: 'public', table: MEMBERS_TABLE }, listener)
        .subscribe()
      return () => void client.removeChannel(channel)
    },
  }
}
