// Account administration: only for an active admin, checked here on every call.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { handleAdminRequest, type AdminBackend, type ProfileRecord } from '../_shared/adminUsers.ts'
import type { AccountErrorCode } from '../_shared/accounts.ts'
import { serveJson } from '../_shared/http.ts'
import { allowedOrigins, publicClient, serviceClient } from '../_runtime/env.ts'

/** Long enough to mean forever: auth bans have no "indefinitely". */
const BAN_FOREVER = '876000h'
const PROFILE_COLUMNS = 'id,user_id,username,email,name,role,active'

function profileError(error: { code?: string; message?: string } | null): AccountErrorCode | null {
  if (!error) return null
  const message = error.message ?? ''
  if (message.includes('profile_last_admin')) return 'last_admin'
  if (error.code !== '23505') return 'failed'
  if (message.includes('name_unique')) return 'name_taken'
  return message.includes('email') ? 'email_taken' : 'username_taken'
}

function createBackend(admin: SupabaseClient): AdminBackend {
  return {
    async callerProfileId(token) {
      const { data: user, error: userError } = await admin.auth.getUser(token)
      if (userError || !user.user) return null
      const { data, error } = await publicClient(token).rpc('current_profile_id')
      return error ? null : ((data as string | null) ?? null)
    },
    async loadProfiles() {
      const { data, error } = await admin.from('profiles').select(PROFILE_COLUMNS)
      if (error) throw error
      return data as ProfileRecord[]
    },
    async createAuthUser(email, password) {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
      if (data.user) return { userId: data.user.id }
      return { error: error?.code === 'email_exists' ? 'email_taken' : 'failed' }
    },
    async deleteAuthUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId)
      return !error
    },
    async insertProfile(userId, account) {
      const { error } = await admin.from('profiles').insert({
        user_id: userId,
        username: account.username,
        email: account.email,
        name: account.name,
        role: account.role,
        ...(account.color ? { color: account.color } : {}),
        must_change_password: true,
      })
      return profileError(error)
    },
    async updateProfile(id, change) {
      const { error } = await admin.from('profiles').update(change).eq('id', id)
      return profileError(error)
    },
    async setAuthPassword(userId, password) {
      const { error } = await admin.auth.admin.updateUserById(userId, { password })
      return !error
    },
    async setAuthBanned(userId, banned) {
      const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: banned ? BAN_FOREVER : 'none' })
      return !error
    },
    async revokeSessions(userId) {
      const { error } = await admin.rpc('revoke_user_sessions', { target: userId })
      if (error) throw error
    },
  }
}

const randomBytes = (length: number): Uint8Array => crypto.getRandomValues(new Uint8Array(length))

Deno.serve((request) =>
  serveJson(request, allowedOrigins(), (body) => {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null
    return handleAdminRequest(token, body, createBackend(serviceClient()), randomBytes)
  }),
)
