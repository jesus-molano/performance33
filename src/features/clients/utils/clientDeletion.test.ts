import { describe, expect, it } from 'vitest'
import type { AppData } from '@/types'
import { describeClientDeletion } from './clientDeletion'

const data = {
  programs: [{ clientId: 'a' }, { clientId: 'a' }, { clientId: 'b' }],
  notes: [{ clientId: 'a' }, { clientId: 'c' }],
} as unknown as Pick<AppData, 'programs' | 'notes'>

describe('describeClientDeletion', () => {
  it('counts only that client', () => {
    expect(describeClientDeletion(data, 'a')).toContain('2 rutinas y 1 nota interna')
  })

  it('names only what exists', () => {
    expect(describeClientDeletion(data, 'b')).toContain('también 1 rutina.')
    expect(describeClientDeletion(data, 'c')).toContain('también 1 nota interna.')
  })

  it('says so when there is nothing else', () => {
    expect(describeClientDeletion(data, 'z')).toBe('No tiene rutinas ni notas internas.')
  })
})
