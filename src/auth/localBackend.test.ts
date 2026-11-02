import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SEED_ADMIN, SEED_MONITOR } from '@/data/seed/staff'
import { createLocalBackend } from './localBackend'

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

describe('local test mode', () => {
  beforeEach(stubStorage)

  it('signs in as a demo person of the requested role', async () => {
    const { auth, team } = createLocalBackend()
    expect(await auth.getUser()).toBeNull()
    await auth.demoSignIn?.('monitor')
    expect((await team.claimProfile())?.id).toBe(SEED_MONITOR.id)
    await auth.signOut()
    expect(await auth.getUser()).toBeNull()
  })

  it('has no password login', async () => {
    const { auth } = createLocalBackend()
    await expect(auth.signInWithPassword('a@b.c', 'x')).rejects.toThrow(/modo local/)
  })

  it('applies the same access rules as the database', async () => {
    const { auth, team } = createLocalBackend()
    await auth.demoSignIn?.('monitor')
    await expect(team.updateAccess(SEED_ADMIN.id, { active: false })).rejects.toThrow(/administrador/)
    await expect(team.updateOwnProfile(SEED_ADMIN.id, { name: 'X', color: '#000000' })).rejects.toThrow(/permiso/)
    await auth.demoSignIn?.('admin')
    await expect(team.updateAccess(SEED_ADMIN.id, { role: 'monitor' })).rejects.toThrow(/propio/)
    await team.updateAccess(SEED_MONITOR.id, { active: false })
    expect((await team.list()).find((m) => m.id === SEED_MONITOR.id)?.active).toBe(false)
  })

  it('a deactivated person loses access', async () => {
    const { auth, team } = createLocalBackend()
    await auth.demoSignIn?.('admin')
    await team.updateAccess(SEED_MONITOR.id, { active: false })
    await auth.signOut()
    await auth.demoSignIn?.('monitor')
    expect((await team.claimProfile())?.role).toBe('monitor')
    expect((await team.claimProfile())?.id).not.toBe(SEED_MONITOR.id)
  })

  it('refuses a repeated email', async () => {
    const { auth, team } = createLocalBackend()
    await auth.demoSignIn?.('admin')
    await expect(team.add({ email: 'DANI@demo.local', name: 'Otra', role: 'monitor' }, '#000000')).rejects.toThrow(/ese email/)
  })
})
