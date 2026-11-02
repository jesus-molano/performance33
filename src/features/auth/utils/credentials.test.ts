import { describe, expect, it } from 'vitest'
import { isValidEmail, newPasswordError } from './credentials'

describe('isValidEmail', () => {
  it('accepts normal addresses, with spaces around', () => {
    expect(isValidEmail(' ana@gym.es ')).toBe(true)
  })

  it('rejects incomplete ones', () => {
    for (const email of ['', 'ana', 'ana@', 'ana@gym', 'a b@gym.es']) expect(isValidEmail(email)).toBe(false)
  })
})

describe('newPasswordError', () => {
  it('asks for a minimum length and for both to match', () => {
    expect(newPasswordError('corta', 'corta')).toMatch(/al menos/)
    expect(newPasswordError('una-contraseña', 'otra-contraseña')).toMatch(/no coinciden/)
    expect(newPasswordError('una-contraseña', 'una-contraseña')).toBeNull()
  })
})
