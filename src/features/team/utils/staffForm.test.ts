import { describe, expect, it } from 'vitest'
import { AVATAR_COLORS } from '@/config/colors'
import { SEED_TEAM } from '@/data/seed/staff'
import { suggestStaffColor, validateNewStaff } from './staffForm'

describe('validateNewStaff', () => {
  it('accepts a new person', () => {
    expect(validateNewStaff('nueva@gym.es', 'Nueva', SEED_TEAM)).toEqual({})
  })

  it('needs a valid, unused email and a name', () => {
    expect(validateNewStaff('nueva', '', SEED_TEAM)).toEqual({ email: 'Escribe un email válido.', name: 'Escribe un nombre.' })
    expect(validateNewStaff(' DANI@demo.local ', 'Dani', SEED_TEAM).email).toMatch(/ese email/)
  })
})

describe('suggestStaffColor', () => {
  it('avoids colours in use', () => {
    expect(SEED_TEAM.map((m) => m.color)).not.toContain(suggestStaffColor(SEED_TEAM))
  })

  it('still returns one when all are used', () => {
    const team = AVATAR_COLORS.map((color) => ({ ...SEED_TEAM[0], color }))
    expect(AVATAR_COLORS).toContain(suggestStaffColor(team))
  })
})
