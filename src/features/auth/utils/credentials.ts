import { PASSWORD_MIN_LENGTH } from '@/features/auth/config'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidEmail = (email: string): boolean => EMAIL_PATTERN.test(email.trim())

/** Spanish message for the new-password form, or null when it is fine. */
export function newPasswordError(password: string, repeated: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`
  return password === repeated ? null : 'Las dos contraseñas no coinciden.'
}

export const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : 'No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo.'
