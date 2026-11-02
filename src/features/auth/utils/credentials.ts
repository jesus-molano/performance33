import { CONNECTION_MESSAGE } from '@/lib/accountMessages'
import { PASSWORD_MIN_LENGTH } from '@/lib/accountRules'

export type PasswordStrength = 'empty' | 'short' | 'weak' | 'fair' | 'strong'

const FAIR_LENGTH = 10
const STRONG_LENGTH = 14

/** A hint, not a rule: only the minimum length is ever refused. */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 'empty'
  if (password.length < PASSWORD_MIN_LENGTH) return 'short'
  const kinds = [/[a-záéíóúñü]/, /[A-ZÁÉÍÓÚÑÜ]/, /\d/, /[^\p{L}\d]/u].filter((kind) => kind.test(password)).length
  if (password.length >= STRONG_LENGTH || (password.length >= FAIR_LENGTH && kinds >= 3)) return 'strong'
  return password.length >= FAIR_LENGTH || kinds >= 2 ? 'fair' : 'weak'
}

/** Spanish message for the new-password form, or null when it is fine. */
export function newPasswordError(password: string, repeated: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`
  return password === repeated ? null : 'Las dos contraseñas no coinciden.'
}

export const errorText = (error: unknown): string => (error instanceof Error ? error.message : CONNECTION_MESSAGE)
