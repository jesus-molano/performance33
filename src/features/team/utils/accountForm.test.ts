import { describe, expect, it } from 'vitest'
import { AVATAR_COLORS } from '@/config/colors'
import { SEED_ADMIN, SEED_MONITOR, SEED_TEAM } from '@/data/seed/team'
import { isNameTaken, sortAccounts, suggestColor, validateNewAccount } from './accountForm'

const VALID = { name: 'Nueva', username: 'nueva.persona', email: '' }

describe('validateNewAccount', () => {
  it('accepts a new person, with or without email', () => {
    expect(validateNewAccount(VALID, SEED_TEAM)).toEqual({})
    expect(validateNewAccount({ ...VALID, email: 'nueva@gym.es' }, SEED_TEAM)).toEqual({})
  })

  it('needs a name and a well-formed username, and a valid email only if there is one', () => {
    expect(validateNewAccount({ name: ' ', username: 'a', email: 'nueva' }, SEED_TEAM)).toEqual({
      name: 'Escribe un nombre.',
      username: expect.stringContaining('Entre 3 y 30'),
      email: expect.stringContaining('email válido'),
    })
    expect(validateNewAccount({ ...VALID, username: 'con espacio' }, SEED_TEAM).username).toBeDefined()
  })

  it('refuses what someone else already has', () => {
    expect(validateNewAccount({ ...VALID, username: SEED_MONITOR.username.toUpperCase() }, SEED_TEAM).username).toMatch(/ese nombre de usuario/)
    expect(validateNewAccount({ ...VALID, email: ' DANI@demo.local ' }, SEED_TEAM).email).toMatch(/ese email/)
    expect(validateNewAccount({ ...VALID, name: 'dani' }, SEED_TEAM).name).toMatch(/ese nombre/)
  })
})

describe('isNameTaken', () => {
  const [first] = SEED_TEAM

  it('ignores case and spaces, but not your own row', () => {
    expect(isNameTaken(`  ${first.name.toUpperCase()} `, SEED_TEAM)).toBe(true)
    expect(isNameTaken(first.name, SEED_TEAM, first.id)).toBe(false)
    expect(isNameTaken('Otra persona', SEED_TEAM)).toBe(false)
  })
})

describe('suggestColor', () => {
  it('avoids colours in use', () => {
    expect(SEED_TEAM.map((m) => m.color)).not.toContain(suggestColor(SEED_TEAM))
  })

  it('still returns one when all are used', () => {
    const team = AVATAR_COLORS.map((color) => ({ ...SEED_TEAM[0], color }))
    expect(AVATAR_COLORS).toContain(suggestColor(team))
  })
})

describe('sortAccounts', () => {
  it('puts deactivated people last', () => {
    const sorted = sortAccounts([{ ...SEED_ADMIN, active: false }, SEED_MONITOR])
    expect(sorted.map((m) => m.id)).toEqual([SEED_MONITOR.id, SEED_ADMIN.id])
  })
})
