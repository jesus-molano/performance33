import { accountErrorMessage } from '@/lib/accountMessages'
import { findAccountConflict, isValidEmail, isValidUsername, normalizeEmail, normalizeUsername } from '@/lib/accountRules'
import { AVATAR_COLORS } from '@/config/colors'
import type { Profile, TeamMember } from '@/types'

export interface AccountFormValues {
  name: string
  username: string
  email: string
}

export type AccountFormErrors = Partial<Record<keyof AccountFormValues, string>>

/** Notes are signed with the name: two people cannot share one (the database refuses it too). */
export function isNameTaken(name: string, team: readonly TeamMember[], exceptId?: string): boolean {
  const clean = name.trim().toLowerCase()
  return team.some((member) => member.id !== exceptId && member.name.trim().toLowerCase() === clean)
}

export function validateNewAccount(values: AccountFormValues, accounts: readonly Profile[]): AccountFormErrors {
  const errors: AccountFormErrors = {}
  const username = normalizeUsername(values.username)
  const email = normalizeEmail(values.email)
  if (!values.name.trim()) errors.name = 'Escribe un nombre.'
  if (!isValidUsername(username)) errors.username = 'Entre 3 y 30 letras sin tildes, números, o . - _ (sin espacios).'
  if (email && !isValidEmail(email)) errors.email = 'Escribe un email válido, o déjalo vacío.'
  const conflict = findAccountConflict(accounts, { name: values.name, username, email: email || null })
  if (conflict === 'name_taken') errors.name ??= accountErrorMessage(conflict)
  if (conflict === 'username_taken') errors.username ??= accountErrorMessage(conflict)
  if (conflict === 'email_taken') errors.email ??= accountErrorMessage(conflict)
  return errors
}

/** First palette colour not used by another coach (so new people look distinct). */
export function suggestColor(team: readonly TeamMember[]): string {
  const used = new Set(team.map((member) => member.color.toLowerCase()))
  return AVATAR_COLORS.find((color) => !used.has(color.toLowerCase())) ?? AVATAR_COLORS[0]
}

/** Active people first, then by name. */
export function sortAccounts<T extends TeamMember>(accounts: readonly T[]): T[] {
  return [...accounts].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'es'))
}
