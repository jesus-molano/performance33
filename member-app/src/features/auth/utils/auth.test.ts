import { describe, expect, it } from 'vitest'
import type { MyMemberRow } from '@shared/booking/memberRpc.ts'
import { COPY } from '@/config/copy'
import { memberAccess, newPasswordError } from './access'
import { gateFor } from './gate'

const member: MyMemberRow = {
  client_id: 'c1',
  username: 'laura',
  email: null,
  first_name: 'Laura',
  color: null,
  plan: 'plus',
  must_change_password: false,
  temporary_password_expired: false,
}

describe('memberAccess', () => {
  it('reads my_member()', () => {
    expect(memberAccess(null)).toBe('none')
    expect(memberAccess(member)).toBe('ok')
    expect(memberAccess({ ...member, must_change_password: true })).toBe('change-password')
    expect(memberAccess({ ...member, must_change_password: true, temporary_password_expired: true })).toBe('expired')
  })
})

describe('newPasswordError', () => {
  it('asks for 10 characters with letters and numbers, typed twice', () => {
    expect(newPasswordError('corta1', 'corta1')).toBe(COPY.password.tooWeak(10))
    expect(newPasswordError('sololetrasaqui', 'sololetrasaqui')).toBe(COPY.password.tooWeak(10))
    expect(newPasswordError('laura2026abc', 'laura2026abd')).toBe(COPY.password.mismatch)
    expect(newPasswordError('laura2026abc', 'laura2026abc')).toBeNull()
  })
})

describe('gateFor', () => {
  const base = { session: 'signed-in' as const, demo: false, demoAccepted: false, access: 'ok' as const }

  it('sends each person to their screen', () => {
    expect(gateFor(base)).toBe('app')
    expect(gateFor({ ...base, session: 'loading' })).toBe('loading')
    expect(gateFor({ ...base, session: 'signed-out' })).toBe('login')
    expect(gateFor({ ...base, access: null })).toBe('loading')
    expect(gateFor({ ...base, access: 'none' })).toBe('no-access')
    expect(gateFor({ ...base, access: 'expired' })).toBe('expired')
    expect(gateFor({ ...base, access: 'change-password' })).toBe('change-password')
  })

  it('shows the offline notice first in the demo', () => {
    expect(gateFor({ ...base, demo: true })).toBe('offline')
    expect(gateFor({ ...base, demo: true, demoAccepted: true })).toBe('app')
  })
})
