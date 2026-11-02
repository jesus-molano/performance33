import type { SupabaseClient } from '@supabase/supabase-js'
import { TAB_ID } from '@/persistence/tabId'
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
}

function failIf(error: { code?: string; message?: string } | null): void {
  if (error) throw new Error(teamErrorMessage(error))
}

const toProfile = ({ must_change_password, ...row }: ProfileRow): Profile => ({ ...row, mustChangePassword: must_change_password })

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

    subscribe(listener) {
      const channel = client
        .channel(`p33-team-${TAB_ID}`)
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
