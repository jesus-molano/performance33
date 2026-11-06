import { describe, expect, it } from 'vitest'
import { memberAppDownloadUrl } from '@/features/members/config/memberApp'
import { memberAccessFromRow, memberAccessStatus } from './access'

const ROW = {
  id: 'm1',
  client_id: 'c1',
  username: 'laura',
  email: null,
  active: true,
  must_change_password: true,
  temp_password_expires_at: '2026-11-09T10:00:00+00:00',
  created_at: '2026-11-06T10:00:00+00:00',
}

describe('member access', () => {
  it('reads the row of the database', () => {
    expect(memberAccessFromRow(ROW)).toEqual({
      clientId: 'c1',
      username: 'laura',
      email: null,
      active: true,
      mustChangePassword: true,
      tempPasswordExpiresAt: Date.parse('2026-11-09T10:00:00Z'),
      createdAt: Date.parse('2026-11-06T10:00:00Z'),
    })
  })

  it('says whether it is waiting, expired, in use or paused', () => {
    const access = memberAccessFromRow(ROW)
    const expires = access.tempPasswordExpiresAt ?? 0
    expect(memberAccessStatus(access, expires - 1)).toBe('pending')
    expect(memberAccessStatus(access, expires)).toBe('expired')
    expect(memberAccessStatus({ ...access, mustChangePassword: false }, expires + 1)).toBe('active')
    expect(memberAccessStatus({ ...access, active: false }, 0)).toBe('paused')
  })

  it('links to the QR page of the members app, configurable per build', () => {
    expect(memberAppDownloadUrl(undefined)).toBe('https://performance33-socios.vercel.app/descargar')
    expect(memberAppDownloadUrl(' https://socios.p33.test/ ')).toBe('https://socios.p33.test/descargar')
  })
})
