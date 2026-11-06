// Members' app accounts: any active coach gives and looks after them; a member can delete their own. Checked on every call.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { AccountErrorCode } from '../_shared/accounts.ts'
import { serveJson } from '../_shared/http.ts'
import { handleMemberRequest, type MemberBackend, type MemberClient, type MemberRecord } from '../_shared/memberAccounts.ts'
import { allowedOrigins, publicClient, serviceClient } from '../_runtime/env.ts'

/** Long enough to mean forever: auth bans have no "indefinitely". */
const BAN_FOREVER = '876000h'
const MEMBER_COLUMNS = 'id,user_id,client_id,username,email,active'

/** The codes the database raises (accounts_keep_apart) or a unique index refusing. */
function memberError(error: { code?: string; message?: string } | null): AccountErrorCode | null {
  if (!error) return null
  const message = error.message ?? ''
  if (message.includes('username')) return 'username_taken'
  if (message.includes('email')) return 'email_taken'
  if (message.includes('client_id')) return 'has_access'
  return 'failed'
}

async function taken(admin: SupabaseClient, column: 'username' | 'email', value: string): Promise<boolean> {
  for (const table of ['profiles', 'members']) {
    const { count, error } = await admin.from(table).select('id', { count: 'exact', head: true }).eq(column, value)
    if (error) throw error
    if (count) return true
  }
  return false
}

function createBackend(admin: SupabaseClient): MemberBackend {
  const memberBy = async (column: 'client_id' | 'user_id', value: string) => {
    const { data, error } = await admin.from('members').select(MEMBER_COLUMNS).eq(column, value).maybeSingle()
    if (error) throw error
    return (data as MemberRecord | null) ?? null
  }
  return {
    async callerStaffId(token) {
      const { data: user, error: userError } = await admin.auth.getUser(token)
      if (userError || !user.user) return null
      const caller = publicClient(token)
      const [{ data: staff, error: staffError }, { data: id, error: idError }] = await Promise.all([
        caller.rpc('is_active_staff'),
        caller.rpc('current_profile_id'),
      ])
      return staffError || idError || staff !== true ? null : ((id as string | null) ?? null)
    },
    async callerUserId(token) {
      const { data, error } = await admin.auth.getUser(token)
      return error || !data.user ? null : data.user.id
    },
    async loadClient(clientId) {
      const { data, error } = await admin.from('clients').select('id,data').eq('id', clientId).maybeSingle()
      if (error) throw error
      if (!data) return null
      const fields = (data.data ?? {}) as Record<string, unknown>
      const text = (value: unknown) => (typeof value === 'string' ? value : '')
      return { id: data.id as string, firstName: text(fields.firstName), lastName: text(fields.lastName), archived: fields.archived === true } satisfies MemberClient
    },
    memberOfClient: (clientId) => memberBy('client_id', clientId),
    memberOfUser: (userId) => memberBy('user_id', userId),
    usernameTaken: (username) => taken(admin, 'username', username),
    emailTaken: (email) => taken(admin, 'email', email),
    async createAuthUser(email, password) {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
      if (data.user) return { userId: data.user.id }
      return { error: error?.code === 'email_exists' ? 'email_taken' : 'failed' }
    },
    async deleteAuthUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId)
      return !error
    },
    async insertMember(userId, member) {
      const { error } = await admin.from('members').insert({
        user_id: userId,
        client_id: member.clientId,
        username: member.username,
        email: member.email,
        created_by: member.createdBy,
        must_change_password: true,
      })
      return memberError(error)
    },
    async updateMember(id, change) {
      const { error } = await admin.from('members').update(change).eq('id', id)
      return memberError(error)
    },
    async setAuthPassword(userId, password) {
      const { error } = await admin.auth.admin.updateUserById(userId, { password })
      return !error
    },
    async setAuthEmail(userId, email) {
      const { error } = await admin.auth.admin.updateUserById(userId, { email, email_confirm: true })
      if (!error) return null
      return error.code === 'email_exists' ? 'email_taken' : 'failed'
    },
    async setAuthBanned(userId, banned) {
      const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: banned ? BAN_FOREVER : 'none' })
      return !error
    },
    async revokeSessions(userId) {
      const { error } = await admin.rpc('revoke_user_sessions', { target: userId })
      if (error) throw error
    },
    async removeGoogleIdentities(userId) {
      // Members have no profiles row, so this removes every Google identity of the login.
      const { error } = await admin.rpc('remove_other_google_identities', { target: userId })
      if (error) throw error
    },
    async clearLoginFailures(username) {
      const { error } = await admin.rpc('login_clear_username', { p_username: username })
      if (error) throw error
    },
    async cancelOwnBookings(token) {
      const { error } = await publicClient(token).rpc('delete_my_bookings')
      if (error) throw error
    },
  }
}

const randomBytes = (length: number): Uint8Array => crypto.getRandomValues(new Uint8Array(length))

Deno.serve((request) =>
  serveJson(request, allowedOrigins(), (body) => {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null
    return handleMemberRequest(token, body, createBackend(serviceClient()), randomBytes)
  }),
)
