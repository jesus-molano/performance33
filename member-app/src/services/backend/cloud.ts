// The gym's Supabase: sign-in as the coaches' web does it, then only the member functions of schema.sql.

import { isAuthApiError, type SupabaseClient } from '@supabase/supabase-js'
import type { MemberRpcs } from '@shared/booking/memberRpc.ts'
import { MEMBER_RPC } from '@shared/booking/memberRpc.ts'
import { BOOKING_RPC, BOOKING_TABLES, bookingSettingsFromRow, type BookingRpcs, type BookingSettingsRow } from '@shared/booking/rpc.ts'
import type { PublicProgram } from '@shared/routine/types.ts'
import { BOOKINGS_CHANNEL, EDGE_FUNCTIONS } from '@/config/app'
import { COPY } from '@/config/copy'
import { isEmailIdentifier, normalizeUsername } from '@/lib/accountRules'
import { codeFromBody, loginErrorMessage, rpcErrorMessage, UserFacingError } from '@/lib/errors'
import type { MemberBackend } from './types'

type Rpcs = MemberRpcs & Pick<BookingRpcs, 'class_slots_for'>

interface SessionTokens {
  access_token: string
  refresh_token: string
}

/** finish_member_password_change raises this while the password is still the temporary one, or once it expired. */
const PASSWORD_NOT_CHANGED = 'password_not_changed'

async function errorBody(error: unknown): Promise<unknown> {
  const context = (error as { context?: unknown } | null)?.context
  if (!(context instanceof Response)) return null
  try {
    return await context.clone().json()
  } catch {
    return null
  }
}

export function createCloudBackend(client: SupabaseClient): MemberBackend {
  async function call<K extends keyof Rpcs>(name: K, args: Rpcs[K]['args']): Promise<Rpcs[K]['result']> {
    const { data, error } = await client.rpc(name, args)
    if (error) throw new UserFacingError(rpcErrorMessage(error.message))
    return data as Rpcs[K]['result']
  }

  async function invoke<T>(name: string, body: object, describe: (code: string | null) => string): Promise<T> {
    const { data, error } = await client.functions.invoke<T>(name, { body })
    if (error || data === null) throw new UserFacingError(describe(codeFromBody(await errorBody(error))))
    return data
  }

  return {
    mode: 'cloud',

    async hasSession() {
      const { data } = await client.auth.getSession()
      return data.session !== null
    },

    onSessionChange(listener) {
      const { data } = client.auth.onAuthStateChange((event, session) => {
        // Deferred: the client must not be called from inside its own callback.
        if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          setTimeout(() => listener(session !== null), 0)
        }
      })
      return () => data.subscription.unsubscribe()
    },

    async signIn(identifier, password) {
      if (isEmailIdentifier(identifier)) {
        const { error } = await client.auth.signInWithPassword({ email: identifier.trim(), password })
        if (error) throw new UserFacingError(loginErrorMessage(isAuthApiError(error) ? 'invalid_credentials' : null))
        return
      }
      const { session } = await invoke<{ session: SessionTokens }>(
        EDGE_FUNCTIONS.loginUsername,
        { username: normalizeUsername(identifier), password },
        loginErrorMessage,
      )
      const { error } = await client.auth.setSession(session)
      if (error) throw new UserFacingError(COPY.common.connection)
    },

    async signOut() {
      // Without connection the session still has to leave this device.
      await client.auth.signOut({ scope: 'local' })
    },

    async changePassword(password) {
      const { error } = await client.auth.updateUser({ password })
      if (error) throw new UserFacingError(error.code === 'same_password' ? COPY.password.same : COPY.common.connection)
      const finish = await client.rpc(MEMBER_RPC.finishPasswordChange, {})
      if (finish.error) {
        throw new UserFacingError(finish.error.message === PASSWORD_NOT_CHANGED ? COPY.password.notChanged : COPY.common.connection)
      }
    },

    async myMember() {
      const rows = await call(MEMBER_RPC.myMember, {})
      return rows[0] ?? null
    },

    async bookingSettings() {
      const { data, error } = await client.from(BOOKING_TABLES.settings).select('*').eq('id', 'main').single<BookingSettingsRow>()
      if (error) throw new UserFacingError(COPY.common.connection)
      return bookingSettingsFromRow(data)
    },

    myBookings: () => call(MEMBER_RPC.myBookings, {}),

    async myWeekUsage(day) {
      const rows = await call(MEMBER_RPC.myWeekUsage, day ? { p_week: day } : {})
      return rows[0] ?? null
    },

    classSlots: (from, to) => call(BOOKING_RPC.classSlotsFor, { p_from: from, p_to: to }),

    async bookClass(slotId) {
      const [result] = await call(MEMBER_RPC.bookClass, { p_slot_id: slotId })
      return result
    },

    async cancelBooking(bookingId) {
      const [result] = await call(MEMBER_RPC.cancelBooking, { p_booking_id: bookingId })
      return result
    },

    async myRoutine() {
      const result = await call(MEMBER_RPC.myRoutine, {})
      return { program: (result.program as PublicProgram | null) ?? null, sessions: result.sessions ?? [] }
    },

    async deleteAccount() {
      await invoke(EDGE_FUNCTIONS.memberAccounts, { action: 'delete-self' }, () => COPY.common.connection)
      await client.auth.signOut({ scope: 'local' })
    },

    watchMyBookings(clientId, onChange) {
      const channel = client
        .channel(`${BOOKINGS_CHANNEL}-${clientId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: BOOKING_TABLES.bookings, filter: `client_id=eq.${clientId}` }, onChange)
        .subscribe()
      return () => void client.removeChannel(channel)
    },
  }
}
