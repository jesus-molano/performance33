import { describe, expect, it } from 'vitest'
import { authErrorMessage, EXPIRED_LINK_MESSAGE, readRedirectError, teamErrorMessage } from './messages'

describe('authErrorMessage', () => {
  it('explains a wrong password', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe('Email o contraseña incorrectos.')
  })

  it('treats anything unknown as a connection problem', () => {
    expect(authErrorMessage({ message: 'Failed to fetch' })).toMatch(/conexión/)
  })

  it('never shows technical words', () => {
    expect(authErrorMessage({ message: 'supabase exploded' })).not.toMatch(/supabase/i)
  })
})

describe('teamErrorMessage', () => {
  it('explains the database rules', () => {
    expect(teamErrorMessage({ code: '23505' })).toMatch(/ese email/)
    expect(teamErrorMessage({ code: 'P0001', message: 'staff_last_admin' })).toMatch(/al menos un administrador/)
    expect(teamErrorMessage({ code: 'P0001', message: 'staff_own_access_locked' })).toMatch(/propio acceso/)
    expect(teamErrorMessage({ code: '42501', message: 'row-level security' })).toMatch(/permiso/)
  })
})

describe('readRedirectError', () => {
  it('finds errors in the query or the hash', () => {
    expect(readRedirectError('?error=access_denied', '')).toBe(EXPIRED_LINK_MESSAGE)
    expect(readRedirectError('', '#error=access_denied&error_code=otp_expired')).toBe(EXPIRED_LINK_MESSAGE)
  })

  it('ignores normal addresses', () => {
    expect(readRedirectError('', '#/clientes')).toBeNull()
    expect(readRedirectError('?code=abc', '')).toBeNull()
  })
})
