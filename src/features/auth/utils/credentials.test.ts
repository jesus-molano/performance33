import { describe, expect, it } from 'vitest'
import { newPasswordError, passwordStrength } from './credentials'

describe('newPasswordError', () => {
  it('asks for a minimum length and for both to match', () => {
    expect(newPasswordError('corta', 'corta')).toMatch(/al menos/)
    expect(newPasswordError('una-contraseña', 'otra-contraseña')).toMatch(/no coinciden/)
    expect(newPasswordError('una-contraseña', 'una-contraseña')).toBeNull()
  })
})

describe('passwordStrength', () => {
  it('goes up with length and variety', () => {
    expect(passwordStrength('')).toBe('empty')
    expect(passwordStrength('corta')).toBe('short')
    expect(passwordStrength('abcdefgh')).toBe('weak')
    expect(passwordStrength('abcdefg1')).toBe('fair')
    expect(passwordStrength('abcdefghij')).toBe('fair')
    expect(passwordStrength('Abcdefgh1!')).toBe('strong')
    expect(passwordStrength('una frase bastante larga')).toBe('strong')
  })
})
