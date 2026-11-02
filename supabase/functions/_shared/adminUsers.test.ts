import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleAdminRequest, type AdminBackend, type ProfileRecord } from './adminUsers.ts'

const profile = (id: string, role: ProfileRecord['role'] = 'monitor', active = true): ProfileRecord => ({
  id,
  user_id: `user-${id}`,
  username: id,
  email: `${id}@gym.es`,
  name: id.toUpperCase(),
  role,
  active,
})

const random = (length: number) => new Uint8Array(length)
const NEW_ACCOUNT = { action: 'create', name: 'Nueva', username: 'nueva', role: 'monitor' }

function fakeBackend(profiles: ProfileRecord[]): AdminBackend {
  return {
    callerProfileId: vi.fn(async (token: string) => (token === 'admin-token' ? 'admin' : token === 'monitor-token' ? 'monitor' : null)),
    loadProfiles: vi.fn(async () => profiles),
    createAuthUser: vi.fn(async () => ({ userId: 'new-user' })),
    deleteAuthUser: vi.fn(async () => true),
    insertProfile: vi.fn(async () => null),
    updateProfile: vi.fn(async () => null),
    setAuthPassword: vi.fn(async () => true),
    setAuthBanned: vi.fn(async () => true),
    revokeSessions: vi.fn(async () => undefined),
    removeOtherGoogleIdentities: vi.fn(async () => undefined),
    clearLoginFailures: vi.fn(async () => undefined),
  }
}

describe('handleAdminRequest', () => {
  let backend: AdminBackend
  const asAdmin = (body: unknown) => handleAdminRequest('admin-token', body, backend, random)

  beforeEach(() => {
    backend = fakeBackend([profile('admin', 'admin'), profile('monitor')])
  })

  it('only an active admin gets through', async () => {
    expect((await handleAdminRequest(null, NEW_ACCOUNT, backend, random)).status).toBe(401)
    expect((await handleAdminRequest('forged', NEW_ACCOUNT, backend, random)).status).toBe(401)
    expect((await handleAdminRequest('monitor-token', NEW_ACCOUNT, backend, random)).status).toBe(403)
    expect(backend.createAuthUser).not.toHaveBeenCalled()
    backend = fakeBackend([profile('admin', 'admin', false)])
    expect((await asAdmin(NEW_ACCOUNT)).status).toBe(403)
  })

  it('creates an account without email on a non-deliverable address, and gives the password once', async () => {
    const result = await asAdmin(NEW_ACCOUNT)
    expect(result.status).toBe(200)
    const { temporaryPassword } = result.body as { temporaryPassword: string }
    expect(backend.createAuthUser).toHaveBeenCalledWith('00000000000000000000000000000000@accounts.invalid', temporaryPassword)
    expect(backend.insertProfile).toHaveBeenCalledWith('new-user', expect.objectContaining({ username: 'nueva', email: null }))
  })

  it('uses the real email when there is one', async () => {
    await asAdmin({ ...NEW_ACCOUNT, email: 'Nueva@Gym.es' })
    expect(backend.createAuthUser).toHaveBeenCalledWith('nueva@gym.es', expect.any(String))
  })

  it('refuses invalid input and repeated data before touching anything', async () => {
    expect((await asAdmin({ ...NEW_ACCOUNT, username: 'x' })).body).toEqual({ error: 'invalid_input' })
    expect((await asAdmin({ ...NEW_ACCOUNT, username: 'monitor' })).body).toEqual({ error: 'username_taken' })
    expect(backend.createAuthUser).not.toHaveBeenCalled()
  })

  it('removes the login again when the profile cannot be saved', async () => {
    vi.mocked(backend.insertProfile).mockResolvedValue('name_taken')
    expect((await asAdmin(NEW_ACCOUNT)).body).toEqual({ error: 'name_taken' })
    expect(backend.deleteAuthUser).toHaveBeenCalledWith('new-user')
  })

  it('reports an email already used by a login', async () => {
    vi.mocked(backend.createAuthUser).mockResolvedValue({ error: 'email_taken' })
    expect((await asAdmin(NEW_ACCOUNT)).body).toEqual({ error: 'email_taken' })
  })

  it('reset: new password first, then the flag, then closes their sessions', async () => {
    const result = await asAdmin({ action: 'reset-password', id: 'monitor' })
    const { temporaryPassword } = result.body as { temporaryPassword: string }
    expect(backend.setAuthPassword).toHaveBeenCalledWith('user-monitor', temporaryPassword)
    expect(backend.updateProfile).toHaveBeenCalledWith('monitor', { must_change_password: true })
    expect(vi.mocked(backend.setAuthPassword).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(backend.updateProfile).mock.invocationCallOrder[0])
    expect(backend.revokeSessions).toHaveBeenCalledWith('user-monitor')
  })

  it('deactivating also bans the login and closes its sessions; reactivating lifts the ban', async () => {
    await asAdmin({ action: 'set-active', id: 'monitor', active: false })
    expect(backend.updateProfile).toHaveBeenCalledWith('monitor', { active: false })
    expect(backend.setAuthBanned).toHaveBeenCalledWith('user-monitor', true)
    expect(backend.revokeSessions).toHaveBeenCalledWith('user-monitor')
    await asAdmin({ action: 'set-active', id: 'monitor', active: true })
    expect(backend.setAuthBanned).toHaveBeenCalledWith('user-monitor', false)
  })

  it('does not ban anyone when the database refuses to deactivate', async () => {
    vi.mocked(backend.updateProfile).mockResolvedValue('last_admin')
    expect((await asAdmin({ action: 'set-active', id: 'monitor', active: false })).body).toEqual({ error: 'last_admin' })
    expect(backend.setAuthBanned).not.toHaveBeenCalled()
  })

  it('changes roles and deletes', async () => {
    await asAdmin({ action: 'set-role', id: 'monitor', role: 'admin' })
    expect(backend.updateProfile).toHaveBeenCalledWith('monitor', { role: 'admin' })
    await asAdmin({ action: 'delete', id: 'monitor' })
    expect(backend.deleteAuthUser).toHaveBeenCalledWith('user-monitor')
  })

  it('nobody can change their own access', async () => {
    for (const body of [
      { action: 'set-active', id: 'admin', active: false },
      { action: 'set-role', id: 'admin', role: 'monitor' },
      { action: 'delete', id: 'admin' },
      { action: 'reset-password', id: 'admin' },
    ]) {
      expect((await asAdmin(body)).body).toEqual({ error: 'own_access' })
    }
  })

  it('refuses unknown actions and values', async () => {
    expect((await asAdmin({ action: 'set-role', id: 'monitor', role: 'jefe' })).status).toBe(400)
    expect((await asAdmin({ action: 'hackear', id: 'monitor' })).status).toBe(400)
    expect((await asAdmin('nada')).status).toBe(400)
  })
})
