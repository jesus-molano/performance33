import { describe, expect, it } from 'vitest'
import { USERNAME_MAX_LENGTH, isValidUsername } from './accounts.ts'
import { MEMBER_USERNAME_FALLBACK, memberUsernameCandidates, parseMemberInvite, parseOptionalEmail, pickFreeUsername } from './memberRules.ts'

describe('member usernames', () => {
  it('come from the full name without accents, then numbered', () => {
    expect(memberUsernameCandidates('Lucía Pérez', 3)).toEqual(['lucia.perez', 'lucia.perez2', 'lucia.perez3'])
  })

  it('a name that gives nothing usable falls back to a word everyone understands', () => {
    expect(memberUsernameCandidates('Al', 2)).toEqual([MEMBER_USERNAME_FALLBACK, `${MEMBER_USERNAME_FALLBACK}2`])
    expect(memberUsernameCandidates('!!!', 1)).toEqual([MEMBER_USERNAME_FALLBACK])
  })

  it('stay valid and within the limit when the name is long', () => {
    const candidates = memberUsernameCandidates('Maximiliano Bartolomé de la Santísima Trinidad', 12)
    for (const candidate of candidates) {
      expect(isValidUsername(candidate), candidate).toBe(true)
      expect(candidate.length).toBeLessThanOrEqual(USERNAME_MAX_LENGTH)
    }
    expect(new Set(candidates).size).toBe(12)
  })

  it('the first free one is taken, or none when all are', async () => {
    expect(await pickFreeUsername('Ana Gil', (u) => u === 'ana.gil')).toBe('ana.gil2')
    expect(await pickFreeUsername('Ana Gil', () => true)).toBeNull()
  })
})

describe('giving the app', () => {
  it('needs a user id; username and email are optional, and checked when given', () => {
    expect(parseMemberInvite({ clientId: 'c1' })).toEqual({ clientId: 'c1', username: null, email: null })
    expect(parseMemberInvite({ clientId: 'c1', username: ' Ana.G ', email: ' Ana@Gym.ES ' })).toEqual({ clientId: 'c1', username: 'ana.g', email: 'ana@gym.es' })
    expect(parseMemberInvite({ clientId: 'c1', username: '', email: '' })).toEqual({ clientId: 'c1', username: null, email: null })
    for (const bad of [null, {}, { clientId: '' }, { clientId: 'a b' }, { clientId: 'c1', username: 'a' }, { clientId: 'c1', email: 'no' }]) {
      expect(parseMemberInvite(bad), JSON.stringify(bad)).toBeNull()
    }
  })

  it('never takes an address of the reserved internal domain', () => {
    expect(parseOptionalEmail('x@accounts.invalid')).toBeUndefined()
    expect(parseOptionalEmail(null)).toBeNull()
  })
})
