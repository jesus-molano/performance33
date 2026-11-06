import type { SupabaseClient } from '@supabase/supabase-js'
import { MEMBERS_TABLE } from '@shared/booking'
import { uniqueChannelTopic } from '@/persistence/tabId'
import type { Profile, TeamMember } from '@/types'
import { invokeFunction } from './edgeFunctions'
import { teamErrorMessage } from './messages'
import type { TeamService } from './types'

const TABLE = 'profiles'
const ADMIN_FUNCTION = 'admin-users'
/** All that the database lets the team read of each other. */
const TEAM_COLUMNS = 'id,name,color,role,active'

interface ProfileRow extends TeamMember {
  username: string
  email: string | null
  must_change_password: boolean
  has_own_password: boolean
  temporary_password_expired: boolean
  google_connected: boolean
}

function failIf(error: { code?: string; message?: string } | null): void {
  if (error) throw new Error(teamErrorMessage(error))
}

const toProfile = ({ must_change_password, has_own_password, temporary_password_expired, google_connected, ...row }: ProfileRow): Profile => ({
  ...row,
  mustChangePassword: must_change_password,
  hasOwnPassword: has_own_password,
  temporaryPasswordExpired: temporary_password_expired,
  googleConnected: google_connected,
})

export function createSupabaseTeam(client: SupabaseClient): TeamService {
  const admin = <T>(action: string, fields: object) => invokeFunction<T>(client, ADMIN_FUNCTION, { action, ...fields })

  return {
    async getOwnProfile() {
      const { data, error } = await client.rpc('my_profile')
      failIf(error)
      const [row] = data as ProfileRow[]
      return row ? toProfile(row) : null
    },

    async list() {
      const { data, error } = await client.from(TABLE).select(TEAM_COLUMNS).order('name')
      failIf(error)
      return data as TeamMember[]
    },

    async updateOwnProfile(id, patch) {
      const { error } = await client.from(TABLE).update(patch).eq('id', id)
      failIf(error)
    },

    async finishPasswordChange() {
      const { error } = await client.rpc('finish_password_change')
      failIf(error)
    },

    async isMemberLogin() {
      // A member reads only their own row (schema.sql, members_select); anyone else without a profile reads none.
      const { data, error } = await client.from(MEMBERS_TABLE).select('id').limit(1)
      return !error && (data?.length ?? 0) > 0
    },

    subscribe(listener) {
      const channel = client
        .channel(uniqueChannelTopic('p33-team'))
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, listener)
        .subscribe()
      return () => void client.removeChannel(channel)
    },

    async listAccounts() {
      const { data, error } = await client.rpc('team_accounts')
      failIf(error)
      return (data as ProfileRow[]).map(toProfile)
    },

    createAccount: async (input) => (await admin<{ temporaryPassword: string }>('create', input)).temporaryPassword,
    resetPassword: async (id) => (await admin<{ temporaryPassword: string }>('reset-password', { id })).temporaryPassword,
    setRole: async (id, role) => void (await admin('set-role', { id, role })),
    setActive: async (id, active) => void (await admin('set-active', { id, active })),
    deleteAccount: async (id) => void (await admin('delete', { id })),
  }
}
