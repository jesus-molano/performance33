import { describe, expect, it } from 'vitest'
import { accountErrorMessage } from '@/lib/accountMessages'
import { memberErrorMessage } from './messages'

describe('member account messages', () => {
  it('speak of the app account, not of the team', () => {
    expect(memberErrorMessage('username_taken')).not.toMatch(/equipo/)
    expect(memberErrorMessage('has_access')).toMatch(/ya tiene acceso/)
    expect(memberErrorMessage('failed')).toBe(accountErrorMessage('failed'))
  })
})
