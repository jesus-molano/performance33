import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { SEED_ADMIN, SEED_MONITOR } from '@/data/seed/team'
import type { Profile } from '@/types'
import { accessChangeError, adoptImportedData, canEditNote } from './ownership'

const other: Profile = { ...SEED_MONITOR, id: 'otro' }

describe('canEditNote', () => {
  it('allows the author and the admin, nobody else', () => {
    const note = { authorId: SEED_MONITOR.id }
    expect(canEditNote(note, SEED_MONITOR)).toBe(true)
    expect(canEditNote(note, SEED_ADMIN)).toBe(true)
    expect(canEditNote(note, other)).toBe(false)
    expect(canEditNote(note, null)).toBe(false)
  })

  it('a deactivated admin has no special powers', () => {
    expect(canEditNote({ authorId: 'x' }, { ...SEED_ADMIN, active: false })).toBe(false)
  })
})

describe('accessChangeError', () => {
  const team = [SEED_ADMIN, SEED_MONITOR]

  it('lets an admin change someone else', () => {
    expect(accessChangeError(team, SEED_ADMIN, SEED_MONITOR.id, { role: 'admin' })).toBeNull()
  })

  it('refuses monitors and changes to oneself', () => {
    expect(accessChangeError(team, SEED_MONITOR, SEED_ADMIN.id, { active: false })).toMatch(/administrador/)
    expect(accessChangeError(team, SEED_ADMIN, SEED_ADMIN.id, { role: 'monitor' })).toMatch(/propio/)
  })

  it('protects the last active admin', () => {
    const second = { ...SEED_ADMIN, id: 'admin2' }
    expect(accessChangeError([...team, second], SEED_ADMIN, second.id, { active: false })).toBeNull()
    const onlySecond = [{ ...SEED_ADMIN, active: false }, second]
    expect(accessChangeError(onlySecond, SEED_ADMIN, second.id, { active: false })).toMatch(/al menos/)
  })
})

describe('adoptImportedData', () => {
  const seed = createSeedData('2026-10-31')

  it('re-signs what comes from people outside the team', () => {
    const data = adoptImportedData(seed, new Set(['yo']), 'yo')
    expect(data.notes.every((n) => n.authorId === 'yo')).toBe(true)
    expect(data.programs.every((p) => p.createdBy === 'yo')).toBe(true)
  })

  it('keeps signatures of people on the team', () => {
    const data = adoptImportedData(seed, new Set([SEED_ADMIN.id, SEED_MONITOR.id]), 'yo')
    expect(data.notes.map((n) => n.authorId)).toEqual(seed.notes.map((n) => n.authorId))
  })

  it('drops notes of clients that do not exist', () => {
    const orphan = { ...seed.notes[0], id: 'huerfana', clientId: 'nadie' }
    const data = adoptImportedData({ ...seed, notes: [...seed.notes, orphan] }, new Set(), 'yo')
    expect(data.notes.some((n) => n.id === 'huerfana')).toBe(false)
  })
})
