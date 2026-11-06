// What the member-accounts function does, over an injected backend (faked in the tests, real in member-accounts/index.ts).
// Any active coach gives a user the app and looks after that account; a member can only delete their own.

import { generateTemporaryPassword, internalEmail, type AccountErrorCode, type RandomBytes } from './accounts.ts'
import { fail, ok, type HandlerResult } from './http.ts'
import { isClientId, parseMemberInvite, parseOptionalEmail, parseOptionalUsername, pickFreeUsername } from './memberRules.ts'

export interface MemberRecord {
  id: string
  user_id: string
  client_id: string
  username: string
  email: string | null
  active: boolean
}

/** What the function needs of the user's file: the name for the username, and whether it is archived. */
export interface MemberClient {
  id: string
  firstName: string
  lastName: string
  archived: boolean
}

export interface NewMember {
  clientId: string
  username: string
  email: string | null
  /** The coach who gave the access. */
  createdBy: string
}

export interface MemberChange {
  username?: string
  email?: string | null
  active?: boolean
  must_change_password?: boolean
}

export interface MemberBackend {
  /** Checks the token and the session behind it: the caller's profile id when they are active staff, else null. */
  callerStaffId(token: string): Promise<string | null>
  /** The auth user behind a valid token, or null. */
  callerUserId(token: string): Promise<string | null>
  loadClient(clientId: string): Promise<MemberClient | null>
  memberOfClient(clientId: string): Promise<MemberRecord | null>
  memberOfUser(userId: string): Promise<MemberRecord | null>
  /** In use by a coach or a member: login-username looks in both. */
  usernameTaken(username: string): Promise<boolean>
  emailTaken(email: string): Promise<boolean>
  /** The new auth user's id, or an error code. Marked as confirmed: no mail is ever sent. */
  createAuthUser(email: string, password: string): Promise<{ userId: string } | { error: AccountErrorCode }>
  deleteAuthUser(userId: string): Promise<boolean>
  insertMember(userId: string, member: NewMember): Promise<AccountErrorCode | null>
  updateMember(id: string, change: MemberChange): Promise<AccountErrorCode | null>
  setAuthPassword(userId: string, password: string): Promise<boolean>
  setAuthEmail(userId: string, email: string): Promise<AccountErrorCode | null>
  setAuthBanned(userId: string, banned: boolean): Promise<boolean>
  revokeSessions(userId: string): Promise<void>
  /** Members never use Google: any Google identity on their login was linked by someone with a session, so it goes. */
  removeGoogleIdentities(userId: string): Promise<void>
  clearLoginFailures(username: string): Promise<void>
  /** delete_my_bookings, as the member: frees their future places. */
  cancelOwnBookings(token: string): Promise<void>
}

export interface MemberCredentials {
  username: string
  temporaryPassword: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const fullName = (client: MemberClient): string => `${client.firstName} ${client.lastName}`.trim()

async function invite(body: unknown, callerId: string, backend: MemberBackend, randomBytes: RandomBytes): Promise<HandlerResult> {
  const request = parseMemberInvite(body)
  if (!request) return fail('invalid_input')
  const client = await backend.loadClient(request.clientId)
  if (!client) return fail('not_found')
  if (client.archived) return fail('archived')
  if (await backend.memberOfClient(client.id)) return fail('has_access')
  let username = request.username
  if (username && (await backend.usernameTaken(username))) return fail('username_taken')
  username ??= await pickFreeUsername(fullName(client), (candidate) => backend.usernameTaken(candidate))
  if (!username) return fail('username_taken')
  if (request.email && (await backend.emailTaken(request.email))) return fail('email_taken')
  const temporaryPassword = generateTemporaryPassword(randomBytes)
  const created = await backend.createAuthUser(request.email ?? internalEmail(randomBytes), temporaryPassword)
  if ('error' in created) return fail(created.error)
  const refused = await backend.insertMember(created.userId, { clientId: client.id, username, email: request.email, createdBy: callerId })
  if (refused) {
    await backend.deleteAuthUser(created.userId)
    return fail(refused)
  }
  return ok({ username, temporaryPassword } satisfies MemberCredentials)
}

async function resetPassword(member: MemberRecord, backend: MemberBackend, randomBytes: RandomBytes): Promise<HandlerResult> {
  const temporaryPassword = generateTemporaryPassword(randomBytes)
  // First, as for the team: a Google account linked from an open session must not outlive the new password.
  await backend.removeGoogleIdentities(member.user_id)
  if (!(await backend.setAuthPassword(member.user_id, temporaryPassword))) return fail('failed')
  // After the password: the database remembers which password was the temporary one.
  const refused = await backend.updateMember(member.id, { must_change_password: true })
  if (refused) return fail(refused)
  await backend.revokeSessions(member.user_id)
  await backend.clearLoginFailures(member.username)
  return ok({ username: member.username, temporaryPassword } satisfies MemberCredentials)
}

async function setActive(member: MemberRecord, active: boolean, backend: MemberBackend): Promise<HandlerResult> {
  if (!(await backend.setAuthBanned(member.user_id, !active))) return fail('failed')
  const refused = await backend.updateMember(member.id, { active })
  if (refused) return fail(refused)
  if (active) await backend.clearLoginFailures(member.username)
  else await backend.revokeSessions(member.user_id)
  return ok({})
}

async function setEmail(member: MemberRecord, raw: unknown, backend: MemberBackend, randomBytes: RandomBytes): Promise<HandlerResult> {
  const email = parseOptionalEmail(raw)
  if (email === undefined) return fail('invalid_input')
  if (email === member.email) return ok({})
  if (email && (await backend.emailTaken(email))) return fail('email_taken')
  const refusedAuth = await backend.setAuthEmail(member.user_id, email ?? internalEmail(randomBytes))
  if (refusedAuth) return fail(refusedAuth)
  // A Google identity tied to the old address would still open the account.
  await backend.removeGoogleIdentities(member.user_id)
  const refused = await backend.updateMember(member.id, { email })
  return refused ? fail(refused) : ok({})
}

async function setUsername(member: MemberRecord, raw: unknown, backend: MemberBackend): Promise<HandlerResult> {
  const username = parseOptionalUsername(raw)
  if (!username) return fail('invalid_input')
  if (username === member.username) return ok({ username })
  if (await backend.usernameTaken(username)) return fail('username_taken')
  const refused = await backend.updateMember(member.id, { username })
  if (refused) return fail(refused)
  await backend.clearLoginFailures(member.username)
  return ok({ username })
}

/** The member leaves: their future places go to the waitlist first, then the login (and with it the account) goes. */
async function deleteSelf(token: string, backend: MemberBackend): Promise<HandlerResult> {
  const userId = await backend.callerUserId(token)
  if (!userId) return fail('unauthorized')
  const member = await backend.memberOfUser(userId)
  if (!member) return fail('forbidden')
  await backend.cancelOwnBookings(token)
  return (await backend.deleteAuthUser(userId)) ? ok({}) : fail('failed')
}

async function changeAccess(body: Record<string, unknown>, backend: MemberBackend, randomBytes: RandomBytes): Promise<HandlerResult> {
  if (!isClientId(body.clientId)) return fail('invalid_input')
  const member = await backend.memberOfClient(body.clientId)
  if (!member) return fail('not_found')
  switch (body.action) {
    case 'reset-password':
      return resetPassword(member, backend, randomBytes)
    case 'set-active':
      return typeof body.active === 'boolean' ? setActive(member, body.active, backend) : fail('invalid_input')
    case 'set-email':
      return setEmail(member, body.email, backend, randomBytes)
    case 'set-username':
      return setUsername(member, body.username, backend)
    case 'remove':
      return (await backend.deleteAuthUser(member.user_id)) ? ok({}) : fail('failed')
    default:
      return fail('invalid_input')
  }
}

export async function handleMemberRequest(token: string | null, body: unknown, backend: MemberBackend, randomBytes: RandomBytes): Promise<HandlerResult> {
  if (!token) return fail('unauthorized')
  if (!isRecord(body)) return fail('invalid_input')
  if (body.action === 'delete-self') return deleteSelf(token, backend)
  const callerId = await backend.callerStaffId(token)
  if (!callerId) return fail('unauthorized')
  if (body.action === 'invite') return invite(body, callerId, backend, randomBytes)
  return changeAccess(body, backend, randomBytes)
}
