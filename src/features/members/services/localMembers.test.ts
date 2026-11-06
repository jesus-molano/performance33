import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLocalBackend } from '@/auth/localBackend'
import { MEMBER_LOGIN_MESSAGE } from '@/auth/messages'
import { LOCAL_TEST_PASSWORDS } from '@/data/seed/team'
import type { Client } from '@/types'
import { createLocalMembers } from './localMembers'

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

const client = (id: string, firstName: string, lastName: string, archived = false) => ({ id, firstName, lastName, archived }) as Client
const CLIENTS = [client('c-laura', 'Laura', 'García'), client('c-lucia', 'Lucía', 'García'), client('c-sergio', 'Sergio', 'Ruiz', true)]
const NOW = Date.parse('2026-11-06T10:00:00Z')

describe('members app accounts in local test mode', () => {
  let coach: string | null
  const service = () => createLocalMembers({ clients: () => CLIENTS, profileId: () => coach, now: () => NOW })

  beforeEach(() => {
    stubStorage()
    coach = 'profile-ana'
  })

  it('a coach gives the app: username from the name, a 72 h temporary password, shown once', async () => {
    const members = service()
    const { username, temporaryPassword } = await members.give('c-laura', { username: null, email: null })
    expect(username).toBe('laura.garcia')
    expect(temporaryPassword).toMatch(/^\w{4}-\w{4}-\w{4}$/)
    expect(await members.load('c-laura')).toMatchObject({ username, mustChangePassword: true, active: true, tempPasswordExpiresAt: NOW + 72 * 3_600_000 })
    expect(JSON.stringify(await members.load('c-laura'))).not.toContain(temporaryPassword)
  })

  it('refuses a second account, archived users, taken usernames and emails, and nobody signed in', async () => {
    const members = service()
    await members.give('c-laura', { username: 'laura', email: 'laura@gym.es' })
    await expect(members.give('c-laura', { username: null, email: null })).rejects.toThrow(/ya tiene acceso/)
    await expect(members.give('c-sergio', { username: null, email: null })).rejects.toThrow(/archivado/)
    await expect(members.give('c-lucia', { username: 'laura', email: null })).rejects.toThrow(/nombre de usuario ya existe/)
    await expect(members.give('c-lucia', { username: 'monitor', email: null })).rejects.toThrow(/nombre de usuario ya existe/)
    await expect(members.give('c-lucia', { username: null, email: 'laura@gym.es' })).rejects.toThrow(/email/)
    coach = null
    await expect(members.give('c-lucia', { username: null, email: null })).rejects.toThrow(/sesión/)
  })

  it('a new password, pausing and removing, each only on an account that exists', async () => {
    const members = service()
    const first = await members.give('c-laura', { username: null, email: null })
    const again = await members.resetPassword('c-laura')
    expect(again.username).toBe(first.username)
    expect(again.temporaryPassword).not.toBe(first.temporaryPassword)
    await members.setActive('c-laura', false)
    expect((await members.load('c-laura'))?.active).toBe(false)
    await members.remove('c-laura')
    expect(await members.load('c-laura')).toBeNull()
    await expect(members.resetPassword('c-laura')).rejects.toThrow(/ya no tiene acceso/)
  })

  it('the coaches demo login refuses a member, saying where to enter; a paused one gets the usual answer', async () => {
    const members = service()
    const { username, temporaryPassword } = await members.give('c-laura', { username: null, email: 'laura@gym.es' })
    const backend = createLocalBackend()
    await expect(backend.auth.signIn(username, temporaryPassword)).rejects.toThrow(MEMBER_LOGIN_MESSAGE)
    await expect(backend.auth.signIn('laura@gym.es', temporaryPassword)).rejects.toThrow(MEMBER_LOGIN_MESSAGE)
    await expect(backend.auth.signIn(username, 'otra')).rejects.toThrow(/incorrectos/)
    await members.setActive('c-laura', false)
    await expect(backend.auth.signIn(username, temporaryPassword)).rejects.toThrow(/incorrectos/)
    expect(await backend.auth.getUser()).toBeNull()
    await backend.auth.signIn('monitor', LOCAL_TEST_PASSWORDS.monitor)
    expect(await backend.team.isMemberLogin()).toBe(false)
  })
})
