// What the admin-users function does, over an injected backend (faked in the tests, real in admin-users/index.ts).

import {
  accessChangeRefusal,
  findAccountConflict,
  generateTemporaryPassword,
  internalEmail,
  isProfileRole,
  parseNewAccount,
  type AccessChange,
  type AccountErrorCode,
  type NewAccount,
  type ProfileRole,
  type RandomBytes,
} from './accounts.ts'
import { fail, ok, type HandlerResult } from './http.ts'

export interface ProfileRecord {
  id: string
  user_id: string
  username: string
  email: string | null
  name: string
  role: ProfileRole
  active: boolean
}

export interface ProfileChange {
  role?: ProfileRole
  active?: boolean
  must_change_password?: boolean
}

export interface AdminBackend {
  /** Checks the token and the session behind it: the caller's profile id, or null when they have no access. */
  callerProfileId(token: string): Promise<string | null>
  loadProfiles(): Promise<ProfileRecord[]>
  /** The new auth user's id, or an error code. Marked as confirmed: no mail is ever sent. */
  createAuthUser(email: string, password: string): Promise<{ userId: string } | { error: AccountErrorCode }>
  deleteAuthUser(userId: string): Promise<boolean>
  insertProfile(userId: string, account: NewAccount): Promise<AccountErrorCode | null>
  updateProfile(id: string, change: ProfileChange): Promise<AccountErrorCode | null>
  setAuthPassword(userId: string, password: string): Promise<boolean>
  setAuthBanned(userId: string, banned: boolean): Promise<boolean>
  revokeSessions(userId: string): Promise<void>
  /** Google accounts connected by hand, not the one of the profile's email. */
  removeOtherGoogleIdentities(userId: string): Promise<void>
  /** Unlocks a username locked by failed logins. */
  clearLoginFailures(username: string): Promise<void>
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

async function createAccount(body: unknown, profiles: ProfileRecord[], backend: AdminBackend, randomBytes: RandomBytes): Promise<HandlerResult> {
  const account = parseNewAccount(body)
  if (!account) return fail('invalid_input')
  const conflict = findAccountConflict(profiles, account)
  if (conflict) return fail(conflict)
  const temporaryPassword = generateTemporaryPassword(randomBytes)
  const created = await backend.createAuthUser(account.email ?? internalEmail(randomBytes), temporaryPassword)
  if ('error' in created) return fail(created.error)
  const refused = await backend.insertProfile(created.userId, account)
  if (refused) {
    await backend.deleteAuthUser(created.userId)
    return fail(refused)
  }
  return ok({ temporaryPassword })
}

async function resetPassword(target: ProfileRecord, backend: AdminBackend, randomBytes: RandomBytes): Promise<HandlerResult> {
  const temporaryPassword = generateTemporaryPassword(randomBytes)
  // First: if it fails nothing has changed yet, and the admin can simply try again.
  await backend.removeOtherGoogleIdentities(target.user_id)
  if (!(await backend.setAuthPassword(target.user_id, temporaryPassword))) return fail('failed')
  // After the password: the database remembers which password was the temporary one.
  const refused = await backend.updateProfile(target.id, { must_change_password: true })
  if (refused) return fail(refused)
  await backend.revokeSessions(target.user_id)
  await backend.clearLoginFailures(target.username)
  return ok({ temporaryPassword })
}

/** The profile goes first when closing (the last-admin rule can refuse it) and last when opening. */
async function setActive(target: ProfileRecord, active: boolean, backend: AdminBackend): Promise<HandlerResult> {
  if (active && !(await backend.setAuthBanned(target.user_id, false))) return fail('failed')
  const refused = await backend.updateProfile(target.id, { active })
  if (refused) return fail(refused)
  if (active) {
    await backend.clearLoginFailures(target.username)
    return ok({})
  }
  if (!(await backend.setAuthBanned(target.user_id, true))) return fail('failed')
  await backend.revokeSessions(target.user_id)
  return ok({})
}

function requestedChange(body: Record<string, unknown>): AccessChange | null {
  switch (body.action) {
    case 'reset-password':
      return { resetPassword: true }
    case 'set-role':
      return isProfileRole(body.role) ? { role: body.role } : null
    case 'set-active':
      return typeof body.active === 'boolean' ? { active: body.active } : null
    case 'delete':
      return { remove: true }
    default:
      return null
  }
}

async function changeAccount(body: Record<string, unknown>, callerId: string, profiles: ProfileRecord[], backend: AdminBackend, randomBytes: RandomBytes): Promise<HandlerResult> {
  const change = requestedChange(body)
  if (!change || typeof body.id !== 'string') return fail('invalid_input')
  const refusal = accessChangeRefusal(profiles, callerId, body.id, change)
  if (refusal) return fail(refusal)
  const target = profiles.find((profile) => profile.id === body.id)
  if (!target) return fail('not_found')
  if ('resetPassword' in change) return resetPassword(target, backend, randomBytes)
  if ('active' in change) return setActive(target, change.active, backend)
  if ('remove' in change) return (await backend.deleteAuthUser(target.user_id)) ? ok({}) : fail('failed')
  const refused = await backend.updateProfile(target.id, { role: change.role })
  return refused ? fail(refused) : ok({})
}

export async function handleAdminRequest(token: string | null, body: unknown, backend: AdminBackend, randomBytes: RandomBytes): Promise<HandlerResult> {
  const callerId = token ? await backend.callerProfileId(token) : null
  if (!callerId) return fail('unauthorized')
  const profiles = await backend.loadProfiles()
  const caller = profiles.find((profile) => profile.id === callerId)
  if (!caller?.active || caller.role !== 'admin') return fail('forbidden')
  if (!isRecord(body)) return fail('invalid_input')
  if (body.action === 'create') return createAccount(body, profiles, backend, randomBytes)
  return changeAccount(body, callerId, profiles, backend, randomBytes)
}
