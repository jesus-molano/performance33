import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleMemberRequest, type MemberBackend, type MemberClient, type MemberRecord } from './memberAccounts.ts'

const random = (length: number) => new Uint8Array(length)

const LAURA: MemberClient = { id: 'c-laura', firstName: 'Laura', lastName: 'García', archived: false }
const SERGIO: MemberClient = { id: 'c-sergio', firstName: 'Sergio', lastName: '', archived: true }
const MARTA_MEMBER: MemberRecord = { id: 'm-marta', user_id: 'user-marta', client_id: 'c-marta', username: 'marta', email: null, active: true }

function fakeBackend(taken: string[] = []): MemberBackend {
  const clients = new Map([LAURA, SERGIO, { id: 'c-marta', firstName: 'Marta', lastName: 'Ruiz', archived: false }].map((c) => [c.id, c]))
  return {
    callerStaffId: vi.fn(async (token: string) => (token === 'coach-token' ? 'profile-ana' : null)),
    callerUserId: vi.fn(async (token: string) => (token === 'marta-token' ? 'user-marta' : token === 'coach-token' ? 'user-ana' : null)),
    loadClient: vi.fn(async (id: string) => clients.get(id) ?? null),
    memberOfClient: vi.fn(async (id: string) => (id === 'c-marta' ? MARTA_MEMBER : null)),
    memberOfUser: vi.fn(async (id: string) => (id === 'user-marta' ? MARTA_MEMBER : null)),
    usernameTaken: vi.fn(async (username: string) => taken.includes(username)),
    emailTaken: vi.fn(async (email: string) => email === 'ana@gym.es'),
    createAuthUser: vi.fn(async () => ({ userId: 'new-user' })),
    deleteAuthUser: vi.fn(async () => true),
    insertMember: vi.fn(async () => null),
    updateMember: vi.fn(async () => null),
    setAuthPassword: vi.fn(async () => true),
    setAuthEmail: vi.fn(async () => null),
    setAuthBanned: vi.fn(async () => true),
    revokeSessions: vi.fn(async () => undefined),
    removeGoogleIdentities: vi.fn(async () => undefined),
    clearLoginFailures: vi.fn(async () => undefined),
    cancelOwnBookings: vi.fn(async () => undefined),
  }
}

describe('handleMemberRequest', () => {
  let backend: MemberBackend
  const asCoach = (body: unknown) => handleMemberRequest('coach-token', body, backend, random)

  beforeEach(() => {
    backend = fakeBackend()
  })

  it('any active coach gets through; nobody else, and a member only for their own deletion', async () => {
    const body = { action: 'invite', clientId: 'c-laura' }
    expect((await handleMemberRequest(null, body, backend, random)).status).toBe(401)
    expect((await handleMemberRequest('forged', body, backend, random)).status).toBe(401)
    expect((await handleMemberRequest('marta-token', body, backend, random)).status).toBe(401)
    expect((await handleMemberRequest('marta-token', { action: 'remove', clientId: 'c-marta' }, backend, random)).status).toBe(401)
    expect(backend.createAuthUser).not.toHaveBeenCalled()
    expect(backend.deleteAuthUser).not.toHaveBeenCalled()
    expect((await asCoach(body)).status).toBe(200)
  })

  it('gives the app with a username from the name and a temporary password, shown once, on a non-deliverable address', async () => {
    const result = await asCoach({ action: 'invite', clientId: 'c-laura' })
    expect(result.status).toBe(200)
    const { username, temporaryPassword } = result.body as { username: string; temporaryPassword: string }
    expect(username).toBe('laura.garcia')
    expect(temporaryPassword).toMatch(/^[\w]{4}-[\w]{4}-[\w]{4}$/)
    expect(backend.createAuthUser).toHaveBeenCalledWith('00000000000000000000000000000000@accounts.invalid', temporaryPassword)
    expect(backend.insertMember).toHaveBeenCalledWith('new-user', { clientId: 'c-laura', username: 'laura.garcia', email: null, createdBy: 'profile-ana' })
  })

  it('numbers the username when it is taken, and keeps the one the coach typed', async () => {
    backend = fakeBackend(['laura.garcia', 'laura.garcia2'])
    expect((await asCoach({ action: 'invite', clientId: 'c-laura' })).body).toMatchObject({ username: 'laura.garcia3' })
    backend = fakeBackend(['laura'])
    expect((await asCoach({ action: 'invite', clientId: 'c-laura', username: 'Laura' })).body).toEqual({ error: 'username_taken' })
    expect((await asCoach({ action: 'invite', clientId: 'c-laura', username: ' LauraG ' })).body).toMatchObject({ username: 'laurag' })
  })

  it('uses the real email when given one, and refuses one in use', async () => {
    await asCoach({ action: 'invite', clientId: 'c-laura', email: 'Laura@Gym.es' })
    expect(backend.createAuthUser).toHaveBeenCalledWith('laura@gym.es', expect.any(String))
    expect((await asCoach({ action: 'invite', clientId: 'c-laura', email: 'ana@gym.es' })).body).toEqual({ error: 'email_taken' })
    vi.mocked(backend.createAuthUser).mockResolvedValue({ error: 'email_taken' })
    expect((await asCoach({ action: 'invite', clientId: 'c-laura', email: 'otra@gym.es' })).body).toEqual({ error: 'email_taken' })
  })

  it('refuses bad input, missing or archived users and a second account, before touching anything', async () => {
    for (const [body, error] of [
      [{ action: 'invite', clientId: 'x y' }, 'invalid_input'],
      [{ action: 'invite', clientId: 'c-laura', username: 'x' }, 'invalid_input'],
      [{ action: 'invite', clientId: 'c-laura', email: 'a@accounts.invalid' }, 'invalid_input'],
      [{ action: 'invite', clientId: 'c-nadie' }, 'not_found'],
      [{ action: 'invite', clientId: 'c-sergio' }, 'archived'],
      [{ action: 'invite', clientId: 'c-marta' }, 'has_access'],
      [{ action: 'volar', clientId: 'c-marta' }, 'invalid_input'],
      [{ action: 'reset-password', clientId: 'c-laura' }, 'not_found'],
    ] as const) {
      expect((await asCoach(body)).body, JSON.stringify(body)).toEqual({ error })
    }
    expect(backend.createAuthUser).not.toHaveBeenCalled()
  })

  it('removes the login again when the account cannot be saved', async () => {
    vi.mocked(backend.insertMember).mockResolvedValue('username_taken')
    expect((await asCoach({ action: 'invite', clientId: 'c-laura' })).body).toEqual({ error: 'username_taken' })
    expect(backend.deleteAuthUser).toHaveBeenCalledWith('new-user')
  })

  it('a new temporary password: first any Google identity goes, then the password, the flag, the sessions, and the username is unlocked', async () => {
    const order: string[] = []
    vi.mocked(backend.removeGoogleIdentities).mockImplementation(async () => void order.push('google'))
    vi.mocked(backend.setAuthPassword).mockImplementation(async () => (order.push('password'), true))
    vi.mocked(backend.updateMember).mockImplementation(async (_id, change) => (order.push(JSON.stringify(change)), null))
    vi.mocked(backend.revokeSessions).mockImplementation(async () => void order.push('revoke'))
    vi.mocked(backend.clearLoginFailures).mockImplementation(async () => void order.push('unlock'))
    const result = await asCoach({ action: 'reset-password', clientId: 'c-marta' })
    expect(result.body).toMatchObject({ username: 'marta', temporaryPassword: expect.any(String) })
    expect(order).toEqual(['google', 'password', '{"must_change_password":true}', 'revoke', 'unlock'])
    expect(backend.removeGoogleIdentities).toHaveBeenCalledWith('user-marta')
  })

  it('a new email drops the Google identities; a refused one leaves everything as it was', async () => {
    vi.mocked(backend.setAuthEmail).mockResolvedValueOnce('email_taken')
    expect((await asCoach({ action: 'set-email', clientId: 'c-marta', email: 'otra@gym.es' })).body).toEqual({ error: 'email_taken' })
    expect(backend.removeGoogleIdentities).not.toHaveBeenCalled()
    expect((await asCoach({ action: 'set-email', clientId: 'c-marta', email: 'otra@gym.es' })).status).toBe(200)
    expect(backend.removeGoogleIdentities).toHaveBeenCalledWith('user-marta')
  })

  it('pausing blocks the login and closes its sessions; resuming lets it in again', async () => {
    await asCoach({ action: 'set-active', clientId: 'c-marta', active: false })
    expect(backend.setAuthBanned).toHaveBeenCalledWith('user-marta', true)
    expect(backend.updateMember).toHaveBeenCalledWith('m-marta', { active: false })
    expect(backend.revokeSessions).toHaveBeenCalledWith('user-marta')
    await asCoach({ action: 'set-active', clientId: 'c-marta', active: true })
    expect(backend.setAuthBanned).toHaveBeenLastCalledWith('user-marta', false)
    expect(backend.clearLoginFailures).toHaveBeenCalledWith('marta')
    expect((await asCoach({ action: 'set-active', clientId: 'c-marta', active: 'no' })).body).toEqual({ error: 'invalid_input' })
  })

  it('changes the email (none = a new non-deliverable address) and the username', async () => {
    expect((await asCoach({ action: 'set-email', clientId: 'c-marta', email: 'Marta@Gym.es' })).status).toBe(200)
    expect(backend.setAuthEmail).toHaveBeenCalledWith('user-marta', 'marta@gym.es')
    expect(backend.updateMember).toHaveBeenCalledWith('m-marta', { email: 'marta@gym.es' })
    expect((await asCoach({ action: 'set-email', clientId: 'c-marta', email: 'ana@gym.es' })).body).toEqual({ error: 'email_taken' })
    expect((await asCoach({ action: 'set-email', clientId: 'c-marta', email: 'mal' })).body).toEqual({ error: 'invalid_input' })
    backend = fakeBackend(['ana'])
    expect((await asCoach({ action: 'set-username', clientId: 'c-marta', username: 'ana' })).body).toEqual({ error: 'username_taken' })
    expect((await asCoach({ action: 'set-username', clientId: 'c-marta', username: 'Marta.R' })).body).toEqual({ username: 'marta.r' })
    expect(backend.updateMember).toHaveBeenCalledWith('m-marta', { username: 'marta.r' })
  })

  it('removing the access deletes the login; the user and their bookings stay', async () => {
    expect((await asCoach({ action: 'remove', clientId: 'c-marta' })).status).toBe(200)
    expect(backend.deleteAuthUser).toHaveBeenCalledWith('user-marta')
    expect(backend.cancelOwnBookings).not.toHaveBeenCalled()
  })

  it('a member deletes their own account: places first, then the login; a coach has none to delete', async () => {
    const order: string[] = []
    vi.mocked(backend.cancelOwnBookings).mockImplementation(async () => void order.push('bookings'))
    vi.mocked(backend.deleteAuthUser).mockImplementation(async (id) => (order.push(id), true))
    expect((await handleMemberRequest('marta-token', { action: 'delete-self' }, backend, random)).status).toBe(200)
    expect(order).toEqual(['bookings', 'user-marta'])
    expect((await asCoach({ action: 'delete-self' })).body).toEqual({ error: 'forbidden' })
    expect((await handleMemberRequest('forged', { action: 'delete-self' }, backend, random)).body).toEqual({ error: 'unauthorized' })
  })
})
