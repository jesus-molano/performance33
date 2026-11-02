import { describe, expect, it } from 'vitest'
import {
  accessChangeRefusal,
  findAccountConflict,
  generateTemporaryPassword,
  internalEmail,
  isAcceptablePassword,
  isEmailIdentifier,
  parseNewAccount,
  suggestUsername,
} from './accounts.ts'

describe('parseNewAccount', () => {
  const valid = { name: ' Ana ', username: ' ANA.perez ', role: 'monitor' }

  it('cleans a valid account and leaves the email optional', () => {
    expect(parseNewAccount(valid)).toEqual({ name: 'Ana', username: 'ana.perez', email: null, role: 'monitor', color: null })
    expect(parseNewAccount({ ...valid, email: ' Ana@Gym.ES ', color: '#112233' })).toMatchObject({ email: 'ana@gym.es', color: '#112233' })
  })

  it('refuses anything malformed', () => {
    for (const change of [
      { name: '' },
      { name: 'x'.repeat(31) },
      { username: 'a' },
      { username: 'con espacio' },
      { username: 'ana@gym.es' },
      { email: 'ana' },
      { email: 'ana@accounts.invalid' },
      { role: 'superadmin' },
      { color: 'url(https://evil.test)' },
    ]) {
      expect(parseNewAccount({ ...valid, ...change }), JSON.stringify(change)).toBeNull()
    }
    expect(parseNewAccount(null)).toBeNull()
  })
})

describe('usernames and emails', () => {
  it('builds an address that cannot receive mail', () => {
    expect(internalEmail((length) => new Uint8Array(length).fill(171))).toBe('abababababababababababababababab@accounts.invalid')
  })

  it('tells an email from a username by the @', () => {
    expect(isEmailIdentifier('ana@gym.es')).toBe(true)
    expect(isEmailIdentifier('ana')).toBe(false)
  })

  it('suggests a username from a name, without accents', () => {
    expect(suggestUsername('  María López ')).toBe('maria.lopez')
    expect(suggestUsername('Ñu!')).toBe('nu')
    expect(suggestUsername('x'.repeat(40))).toHaveLength(30)
  })
})

describe('findAccountConflict', () => {
  const accounts = [{ id: '1', name: 'Ana', username: 'ana', email: 'ana@gym.es' }]

  it('finds what is already in use', () => {
    expect(findAccountConflict(accounts, { name: 'Otra', username: 'ana', email: null })).toBe('username_taken')
    expect(findAccountConflict(accounts, { name: 'Otra', username: 'otra', email: 'ana@gym.es' })).toBe('email_taken')
    expect(findAccountConflict(accounts, { name: ' ANA ', username: 'otra', email: null })).toBe('name_taken')
    expect(findAccountConflict(accounts, { name: 'Otra', username: 'otra', email: null })).toBeNull()
  })
})

describe('accessChangeRefusal', () => {
  const team = [
    { id: 'admin', role: 'admin', active: true },
    { id: 'monitor', role: 'monitor', active: true },
  ] as const

  it('lets an admin change someone else', () => {
    expect(accessChangeRefusal(team, 'admin', 'monitor', { role: 'admin' })).toBeNull()
    expect(accessChangeRefusal(team, 'admin', 'monitor', { remove: true })).toBeNull()
  })

  it('refuses changes to oneself', () => {
    for (const change of [{ role: 'monitor' }, { active: false }, { remove: true }, { resetPassword: true }] as const) {
      expect(accessChangeRefusal(team, 'admin', 'admin', change)).toBe('own_access')
    }
  })

  it('refuses an unknown person', () => {
    expect(accessChangeRefusal(team, 'admin', 'nadie', { active: false })).toBe('not_found')
  })

  it('protects the last active admin', () => {
    const other = [{ id: 'yo', role: 'admin', active: false }, { id: 'otra', role: 'admin', active: true }] as const
    expect(accessChangeRefusal(other, 'yo', 'otra', { active: false })).toBe('last_admin')
    expect(accessChangeRefusal(other, 'yo', 'otra', { role: 'monitor' })).toBe('last_admin')
    expect(accessChangeRefusal(other, 'yo', 'otra', { remove: true })).toBe('last_admin')
    expect(accessChangeRefusal(other, 'yo', 'otra', { resetPassword: true })).toBeNull()
    expect(accessChangeRefusal([...other, { id: 'tercera', role: 'admin', active: true }], 'yo', 'otra', { active: false })).toBeNull()
  })
})

describe('generateTemporaryPassword', () => {
  const random = (length: number) => crypto.getRandomValues(new Uint8Array(length))

  it('is readable and long enough', () => {
    const password = generateTemporaryPassword(random)
    expect(password).toMatch(/^[a-zA-Z2-9]{4}-[a-zA-Z2-9]{4}-[a-zA-Z2-9]{4}$/)
    expect(password).not.toMatch(/[01OIl]/)
  })

  it('is different each time', () => {
    expect(generateTemporaryPassword(random)).not.toBe(generateTemporaryPassword(random))
  })

  it('throws away the bytes that would bias it', () => {
    let calls = 0
    const onlyHighBytes = (length: number) => new Uint8Array(length).fill(calls++ === 0 ? 255 : 0)
    expect(generateTemporaryPassword(onlyHighBytes)).toBe('2aaa-aaaa-aaaa')
    expect(calls).toBe(3)
  })

  it('always has a letter and a digit, as the auth server requires', () => {
    for (let i = 0; i < 50; i++) expect(isAcceptablePassword(generateTemporaryPassword(random))).toBe(true)
  })
})
