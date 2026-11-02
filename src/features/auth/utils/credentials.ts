import { CONNECTION_MESSAGE } from '@/lib/accountMessages'
import { isAcceptablePassword, PASSWORD_MIN_LENGTH } from '@/lib/accountRules'

export type PasswordStrength = 'empty' | 'short' | 'weak' | 'fair' | 'strong'

const FAIR_LENGTH = 12
const STRONG_LENGTH = 14

/** A hint on top of the rule in newPasswordError. */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 'empty'
  if (password.length < PASSWORD_MIN_LENGTH) return 'short'
  const kinds = [/[a-záéíóúñü]/, /[A-ZÁÉÍÓÚÑÜ]/, /\d/, /[^\p{L}\d]/u].filter((kind) => kind.test(password)).length
  if (password.length >= STRONG_LENGTH || (password.length >= FAIR_LENGTH && kinds >= 3)) return 'strong'
  return password.length >= FAIR_LENGTH || kinds >= 2 ? 'fair' : 'weak'
}

/** Spanish message for the new-password form, or null when it is fine. */
export function newPasswordError(password: string, repeated: string): string | null {
  if (!isAcceptablePassword(password)) return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres, con letras y números.`
  return password === repeated ? null : 'Las dos contraseñas no coinciden.'
}

export const errorText = (error: unknown): string => (error instanceof Error ? error.message : CONNECTION_MESSAGE)
