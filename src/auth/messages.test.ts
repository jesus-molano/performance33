import { describe, expect, it } from 'vitest'
import { accountErrorMessage, errorCodeFromBody } from '@/lib/accountMessages'
import { authErrorMessage, GOOGLE_FAILED_MESSAGE, GOOGLE_IN_USE_MESSAGE, GOOGLE_NO_ACCOUNT_MESSAGE, isSamePasswordError, readRedirectError, teamErrorMessage } from './messages'

describe('authErrorMessage', () => {
  it('uses one answer for a wrong password, a blocked account and an unconfirmed one', () => {
    const wrong = authErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })
    expect(wrong).toBe('Email, nombre de usuario o contraseña incorrectos.')
    expect(authErrorMessage({ code: 'user_banned' })).toBe(wrong)
    expect(authErrorMessage({ code: 'email_not_confirmed' })).toBe(wrong)
  })

  it('treats anything unknown as a connection problem', () => {
    expect(authErrorMessage({ message: 'Failed to fetch' })).toMatch(/conexión/)
  })

  it('never shows technical words', () => {
    expect(authErrorMessage({ message: 'supabase exploded' })).not.toMatch(/supabase/i)
  })

  it('recognises a repeated password', () => {
    expect(isSamePasswordError({ code: 'same_password' })).toBe(true)
    expect(isSamePasswordError({ code: 'weak_password' })).toBe(false)
  })
})

describe('teamErrorMessage', () => {
  it('explains the database rules', () => {
    expect(teamErrorMessage({ code: '23505', message: 'violates unique constraint "profiles_name_unique"' })).toMatch(/ese nombre/)
    expect(teamErrorMessage({ code: 'P0001', message: 'password_not_changed' })).toMatch(/distinta/)
    expect(teamErrorMessage({ code: '42501', message: 'row-level security' })).toMatch(/permiso/)
  })
})

describe('edge function errors', () => {
  it('reads the code of the body, and never trusts anything else', () => {
    expect(errorCodeFromBody({ error: 'last_admin' })).toBe('last_admin')
    expect(errorCodeFromBody({ error: 'detalle interno' })).toBe('failed')
    expect(errorCodeFromBody(null)).toBe('failed')
    expect(accountErrorMessage('last_admin')).toMatch(/al menos un administrador/)
    expect(accountErrorMessage('own_access')).toMatch(/propio acceso/)
  })
})

describe('readRedirectError', () => {
  it('explains a Google account that is not on the team', () => {
    expect(readRedirectError('?error=access_denied&error_code=signup_disabled', '')).toBe(GOOGLE_NO_ACCOUNT_MESSAGE)
    expect(readRedirectError('?error=server_error&error_description=Signups+not+allowed+for+this+instance', '')).toBe(GOOGLE_NO_ACCOUNT_MESSAGE)
  })

  it('explains a Google account linked to someone else', () => {
    expect(readRedirectError('', '#error=x&error_code=identity_already_exists')).toBe(GOOGLE_IN_USE_MESSAGE)
  })

  it('anything else is a generic failure', () => {
    expect(readRedirectError('?error=access_denied', '')).toBe(GOOGLE_FAILED_MESSAGE)
  })

  it('ignores normal addresses', () => {
    expect(readRedirectError('', '#/clientes')).toBeNull()
    expect(readRedirectError('?code=abc', '')).toBeNull()
  })
})
