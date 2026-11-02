import { describe, expect, it } from 'vitest'
import { newPasswordError, passwordStrength } from './credentials'

describe('newPasswordError', () => {
  it('asks for a minimum length and for both to match', () => {
    expect(newPasswordError('corta', 'corta')).toMatch(/al menos/)
    expect(newPasswordError('una-contraseña-1', 'otra-contraseña-1')).toMatch(/no coinciden/)
    expect(newPasswordError('una-contraseña-1', 'una-contraseña-1')).toBeNull()
  })

  it('needs letters and digits, like the server', () => {
    expect(newPasswordError('123456789012', '123456789012')).toMatch(/letras y números/)
    expect(newPasswordError('solo-letras-largas', 'solo-letras-largas')).toMatch(/letras y números/)
  })
})

describe('passwordStrength', () => {
  it('goes up with length and variety', () => {
    expect(passwordStrength('')).toBe('empty')
    expect(passwordStrength('corta')).toBe('short')
    expect(passwordStrength('abcdefghij')).toBe('weak')
    expect(passwordStrength('abcdefghi1')).toBe('fair')
    expect(passwordStrength('abcdefghijkl')).toBe('fair')
    expect(passwordStrength('Abcdefghij1!')).toBe('strong')
    expect(passwordStrength('una frase bastante larga')).toBe('strong')
  })
})
