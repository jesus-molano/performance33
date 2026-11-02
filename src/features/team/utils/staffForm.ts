import { AVATAR_COLORS } from '@/config/colors'
import type { StaffMember } from '@/types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface StaffFormErrors {
  email?: string
  name?: string
}

export function validateNewStaff(email: string, name: string, team: readonly StaffMember[]): StaffFormErrors {
  const errors: StaffFormErrors = {}
  const clean = email.trim().toLowerCase()
  if (!EMAIL_PATTERN.test(clean)) errors.email = 'Escribe un email válido.'
  else if (team.some((member) => member.email === clean)) errors.email = 'Ya hay alguien en el equipo con ese email.'
  if (!name.trim()) errors.name = 'Escribe un nombre.'
  return errors
}

/** First palette colour not used by another coach (so new people look distinct). */
export function suggestStaffColor(team: readonly StaffMember[]): string {
  const used = new Set(team.map((member) => member.color.toLowerCase()))
  return AVATAR_COLORS.find((color) => !used.has(color.toLowerCase())) ?? AVATAR_COLORS[0]
}
