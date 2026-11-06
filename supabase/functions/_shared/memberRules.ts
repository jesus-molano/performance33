// Rules of a member's app account, shared by the member-accounts function (Deno) and the web's local mode (Vite).
// Pure: no network, so vitest covers them and both sides pick the same usernames and refuse the same input.

import {
  INTERNAL_EMAIL_DOMAIN,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  isValidEmail,
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
  suggestUsername,
} from './accounts.ts'

/** When a name gives nothing usable ('Al', only symbols). */
export const MEMBER_USERNAME_FALLBACK = 'usuario'
/** 'laura.garcia', then 'laura.garcia2' … up to this many tries. */
export const MEMBER_USERNAME_TRIES = 50

/** Same shape as the ids the app makes (schema.sql checks it on the TV sections too). */
const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/** The username a coach does not have to think about: from the user's full name, then numbered. */
export function memberUsernameCandidates(fullName: string, tries: number = MEMBER_USERNAME_TRIES): string[] {
  const suggested = suggestUsername(fullName)
  const base = suggested.length >= USERNAME_MIN_LENGTH && isValidUsername(suggested) ? suggested : MEMBER_USERNAME_FALLBACK
  const candidates = [base]
  for (let number = 2; candidates.length < tries; number++) {
    const suffix = String(number)
    candidates.push(`${base.slice(0, USERNAME_MAX_LENGTH - suffix.length).replace(/[._-]+$/, '')}${suffix}`)
  }
  return candidates
}

/** The first candidate nobody has, or null when every one is taken. */
export async function pickFreeUsername(fullName: string, isTaken: (username: string) => Promise<boolean> | boolean): Promise<string | null> {
  for (const candidate of memberUsernameCandidates(fullName)) {
    if (!(await isTaken(candidate))) return candidate
  }
  return null
}

export const isClientId = (value: unknown): value is string => typeof value === 'string' && CLIENT_ID_PATTERN.test(value)

/** '' or null = no email; undefined = not a valid one (or the reserved internal domain). */
export function parseOptionalEmail(raw: unknown): string | null | undefined {
  if (raw == null || (typeof raw === 'string' && !raw.trim())) return null
  if (typeof raw !== 'string') return undefined
  const email = normalizeEmail(raw)
  return isValidEmail(email) && !email.endsWith(`@${INTERNAL_EMAIL_DOMAIN}`) ? email : undefined
}

/** '' or null = pick one from the name; undefined = not a valid username. */
export function parseOptionalUsername(raw: unknown): string | null | undefined {
  if (raw == null || (typeof raw === 'string' && !raw.trim())) return null
  if (typeof raw !== 'string') return undefined
  const username = normalizeUsername(raw)
  return isValidUsername(username) ? username : undefined
}

export interface MemberInvite {
  clientId: string
  /** Null: picked from the user's name. */
  username: string | null
  email: string | null
}

/** The validated request to give someone the app, or null when anything is malformed. */
export function parseMemberInvite(raw: unknown): MemberInvite | null {
  if (!isRecord(raw) || !isClientId(raw.clientId)) return null
  const username = parseOptionalUsername(raw.username)
  const email = parseOptionalEmail(raw.email)
  if (username === undefined || email === undefined) return null
  return { clientId: raw.clientId, username, email }
}
