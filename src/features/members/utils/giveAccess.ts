// The "Dar acceso a la app" form: the username it suggests and what it sends (pure).

import { memberUsernameCandidates, parseOptionalEmail, parseOptionalUsername } from '@/lib/memberRules'
import type { GiveAccessInput } from '@/features/members/types'

/** The username the server tries first for this person (it numbers it if someone has it). */
export const suggestedUsername = (fullName: string): string => memberUsernameCandidates(fullName, 1)[0]

export interface GiveAccessDraft {
  username: string
  email: string
  /** The coach changed the suggestion: then it is kept as typed, or refused if taken. */
  usernameEdited: boolean
}

export interface GiveAccessErrors {
  username?: 'invalid'
  email?: 'invalid'
}

export function giveAccessErrors(draft: GiveAccessDraft): GiveAccessErrors {
  const errors: GiveAccessErrors = {}
  if (draft.usernameEdited && !parseOptionalUsername(draft.username)) errors.username = 'invalid'
  if (parseOptionalEmail(draft.email) === undefined) errors.email = 'invalid'
  return errors
}

/** An unchanged suggestion goes as null, so the server numbers it when someone already has it. */
export function giveAccessInput(draft: GiveAccessDraft): GiveAccessInput {
  return {
    username: draft.usernameEdited ? (parseOptionalUsername(draft.username) ?? null) : null,
    email: parseOptionalEmail(draft.email) ?? null,
  }
}
