import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LOCAL_TEST_PASSWORDS, SEED_ADMIN, SEED_MONITOR, SEED_NEW_MONITOR } from '@/data/seed/team'
import { createLocalBackend } from './localBackend'
import { SamePasswordError } from './messages'

function stubStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('window', {
    addEventListener: () => undefined,
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  })
}

const NEW_INPUT = { name: 'Nueva persona', username: 'persona', email: null, role: 'monitor', color: '#000000' } as const

describe('local test mode', () => {
  beforeEach(stubStorage)

  const enter = (backend: ReturnType<typeof createLocalBackend>, username: string) => backend.auth.signIn(username, LOCAL_TEST_PASSWORDS[username])

  it('enters with the username or the email, and only with the right password', async () => {
    const backend = createLocalBackend()
    expect(await backend.auth.getUser()).toBeNull()
    await expect(backend.auth.signIn('monitor', 'mala')).rejects.toThrow(/incorrectos/)
    await expect(backend.auth.signIn('nadie', 'x')).rejects.toThrow(/incorrectos/)
    await enter(backend, 'monitor')
    expect((await backend.team.getOwnProfile())?.id).toBe(SEED_MONITOR.id)
    await backend.auth.signOut()
    await backend.auth.signIn(' CARLA@demo.local ', LOCAL_TEST_PASSWORDS.admin)
    expect((await backend.team.getOwnProfile())?.id).toBe(SEED_ADMIN.id)
  })

  it('first login: must change the password before anything else, and to a different one', async () => {
    const backend = createLocalBackend()
    await enter(backend, SEED_NEW_MONITOR.username)
    expect((await backend.team.getOwnProfile())?.mustChangePassword).toBe(true)
    await expect(backend.team.finishPasswordChange()).rejects.toThrow(/distinta/)
    await expect(backend.auth.changePassword(LOCAL_TEST_PASSWORDS.nueva)).rejects.toBeInstanceOf(SamePasswordError)
    await backend.auth.changePassword('otra-contraseña')
    await backend.team.finishPasswordChange()
    expect((await backend.team.getOwnProfile())?.mustChangePassword).toBe(false)
    await backend.auth.signOut()
    await backend.auth.signIn('nueva', 'otra-contraseña')
    expect(await backend.auth.getUser()).not.toBeNull()
  })

  it('applies the same access rules as the server', async () => {
    const backend = createLocalBackend()
    await enter(backend, 'monitor')
    await expect(backend.team.setActive(SEED_ADMIN.id, false)).rejects.toThrow(/administrador/)
    await expect(backend.team.createAccount(NEW_INPUT)).rejects.toThrow(/permiso/)
    await expect(backend.team.listAccounts()).rejects.toThrow(/permiso/)
    await expect(backend.team.updateOwnProfile(SEED_ADMIN.id, { name: 'X', color: '#000000' })).rejects.toThrow(/permiso/)
    await backend.auth.signOut()
    await enter(backend, 'admin')
    await expect(backend.team.setRole(SEED_ADMIN.id, 'monitor')).rejects.toThrow(/propio/)
    await expect(backend.team.deleteAccount(SEED_ADMIN.id)).rejects.toThrow(/propio/)
    await backend.team.setActive(SEED_MONITOR.id, false)
    expect((await backend.team.listAccounts()).find((m) => m.id === SEED_MONITOR.id)?.active).toBe(false)
  })

  it('the team list carries no usernames, emails or passwords', async () => {
    const backend = createLocalBackend()
    await enter(backend, 'monitor')
    for (const member of await backend.team.list()) expect(Object.keys(member).sort()).toEqual(['active', 'color', 'id', 'name', 'role'])
  })

  it('a deactivated person can no longer enter', async () => {
    const backend = createLocalBackend()
    await enter(backend, 'admin')
    await backend.team.setActive(SEED_MONITOR.id, false)
    await backend.auth.signOut()
    await expect(enter(backend, 'monitor')).rejects.toThrow(/incorrectos/)
  })

  it('creates an account that must set its password, and shows the temporary one only then', async () => {
    const backend = createLocalBackend()
    await enter(backend, 'admin')
    const password = await backend.team.createAccount(NEW_INPUT)
    expect(password).toMatch(/^.{4}-.{4}-.{4}$/)
    await expect(backend.team.createAccount(NEW_INPUT)).rejects.toThrow(/ese nombre de usuario/)
    await expect(backend.team.createAccount({ ...NEW_INPUT, username: 'otra', email: 'DANI@demo.local' })).rejects.toThrow(/ese email/)
    const created = (await backend.team.listAccounts()).find((m) => m.username === 'persona')
    expect(created).toMatchObject({ mustChangePassword: true })
    expect(JSON.stringify(created)).not.toContain(password)
    await backend.auth.signOut()
    await backend.auth.signIn('persona', password)
    expect((await backend.team.getOwnProfile())?.mustChangePassword).toBe(true)
  })

  it('resetting a password replaces the old one and asks to change it again', async () => {
    const backend = createLocalBackend()
    await enter(backend, 'admin')
    const password = await backend.team.resetPassword(SEED_MONITOR.id)
    await backend.auth.signOut()
    await expect(enter(backend, 'monitor')).rejects.toThrow(/incorrectos/)
    await backend.auth.signIn('monitor', password)
    expect((await backend.team.getOwnProfile())?.mustChangePassword).toBe(true)
  })

  it('deletes an account', async () => {
    const backend = createLocalBackend()
    await enter(backend, 'admin')
    await backend.team.deleteAccount(SEED_MONITOR.id)
    expect((await backend.team.list()).map((m) => m.id)).not.toContain(SEED_MONITOR.id)
  })
})
