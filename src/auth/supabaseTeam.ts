import type { SupabaseClient } from '@supabase/supabase-js'
import type { StaffMember } from '@/types'
import { teamErrorMessage } from './messages'
import { TAB_ID } from '@/persistence/tabId'
import type { TeamService } from './types'

const COLUMNS = 'id,email,name,color,role,active'
const TABLE = 'staff'

function failIf(error: { code?: string; message?: string } | null): void {
  if (error) throw new Error(teamErrorMessage(error))
}

export function createSupabaseTeam(client: SupabaseClient): TeamService {
  return {
    async claimProfile() {
      const { data, error } = await client.rpc('claim_staff_profile')
      if (error) throw new Error(error.message)
      return ((data as StaffMember[])[0] as StaffMember | undefined) ?? null
    },

    async list() {
      const { data, error } = await client.from(TABLE).select(COLUMNS).order('name')
      if (error) throw new Error(error.message)
      return data as StaffMember[]
    },

    async add(input, color) {
      const { error } = await client.from(TABLE).insert({ ...input, color })
      failIf(error)
    },

    async updateAccess(id, patch) {
      const { error } = await client.from(TABLE).update(patch).eq('id', id)
      failIf(error)
    },

    async updateOwnProfile(id, patch) {
      const { error } = await client.from(TABLE).update(patch).eq('id', id)
      failIf(error)
    },

    subscribe(listener) {
      const channel = client
        .channel(`p33-team-${TAB_ID}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, listener)
        .subscribe()
      return () => void client.removeChannel(channel)
    },
  }
}
