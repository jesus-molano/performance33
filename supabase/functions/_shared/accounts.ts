// Rules of an account, shared by the edge functions (Deno) and the web app (Vite).
// Pure: no imports and no network, so vitest covers them and both sides apply the same rules.

export const PROFILE_ROLES = ['admin', 'monitor'] as const
export type ProfileRole = (typeof PROFILE_ROLES)[number]

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30
export const ACCOUNT_NAME_MAX_LENGTH = 30
export const PASSWORD_MIN_LENGTH = 8
/** `.invalid` is reserved (RFC 2606): nothing can ever be delivered to it. */
export const INTERNAL_EMAIL_DOMAIN = 'accounts.invalid'

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

export type AccountErrorCode =
  | 'invalid_input'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'own_access'
  | 'last_admin'
  | 'username_taken'
  | 'email_taken'
  | 'name_taken'
  | 'invalid_credentials'
  | 'locked'
  | 'failed'

export const normalizeUsername = (username: string): string => username.trim().toLowerCase()
export const isValidUsername = (username: string): boolean => USERNAME_PATTERN.test(username)
export const normalizeEmail = (email: string): string => email.trim().toLowerCase()
export const isValidEmail = (email: string): boolean => EMAIL_PATTERN.test(email.trim())
export const internalEmail = (username: string): string => `${username}@${INTERNAL_EMAIL_DOMAIN}`
/** Usernames cannot contain '@', so the login field can tell them apart from an email. */
export const isEmailIdentifier = (identifier: string): boolean => identifier.includes('@')

/** 'María López' → 'maria.lopez'. */
export function suggestUsername(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, USERNAME_MAX_LENGTH)
    .replace(/\.+$/, '')
}

export interface NewAccount {
  name: string
  username: string
  email: string | null
  role: ProfileRole
  color: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

export const isProfileRole = (value: unknown): value is ProfileRole => PROFILE_ROLES.includes(value as ProfileRole)

/** The validated new account, or null when anything is missing or malformed. */
export function parseNewAccount(raw: unknown): NewAccount | null {
  if (!isRecord(raw) || typeof raw.name !== 'string' || typeof raw.username !== 'string' || !isProfileRole(raw.role)) return null
  const name = raw.name.trim()
  const username = normalizeUsername(raw.username)
  if (!name || name.length > ACCOUNT_NAME_MAX_LENGTH || !isValidUsername(username)) return null
  const email = typeof raw.email === 'string' && raw.email.trim() ? normalizeEmail(raw.email) : null
  if (email && (!isValidEmail(email) || email.endsWith(`@${INTERNAL_EMAIL_DOMAIN}`))) return null
  if (raw.color != null && (typeof raw.color !== 'string' || !COLOR_PATTERN.test(raw.color))) return null
  return { name, username, email, role: raw.role, color: raw.color ?? null }
}

export interface AccountIdentity {
  id: string
  name: string
  username: string
  email: string | null
}

/** Which field of a new account is already in use. Names too: notes are signed with them. */
export function findAccountConflict(accounts: readonly AccountIdentity[], account: Pick<NewAccount, 'name' | 'username' | 'email'>): AccountErrorCode | null {
  const name = account.name.trim().toLowerCase()
  if (accounts.some((other) => other.username === account.username)) return 'username_taken'
  if (account.email && accounts.some((other) => other.email === account.email)) return 'email_taken'
  return accounts.some((other) => other.name.trim().toLowerCase() === name) ? 'name_taken' : null
}

export interface AccessSummary {
  id: string
  role: ProfileRole
  active: boolean
}

export type AccessChange = { role: ProfileRole } | { active: boolean } | { remove: true } | { resetPassword: true }

/** Why this change to an account is refused, or null when it is fine. Assumes the actor is an admin. */
export function accessChangeRefusal(team: readonly AccessSummary[], actorId: string | null, targetId: string, change: AccessChange): AccountErrorCode | null {
  if (actorId === targetId) return 'own_access'
  const target = team.find((member) => member.id === targetId)
  if (!target) return 'not_found'
  const staysAdmin =
    !('remove' in change) && ('role' in change ? change.role : target.role) === 'admin' && ('active' in change ? change.active : target.active)
  const isAdmin = target.role === 'admin' && target.active
  const anotherAdmin = team.some((member) => member.id !== targetId && member.role === 'admin' && member.active)
  return isAdmin && !staysAdmin && !anotherAdmin ? 'last_admin' : null
}

/** Without the characters people mistake for each other (0/O, 1/l/I). */
const TEMP_PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
const TEMP_PASSWORD_GROUPS = 3
const TEMP_PASSWORD_GROUP_LENGTH = 4
/** Bytes above this would make the first letters of the alphabet more likely than the rest. */
const UNBIASED_BYTE_LIMIT = 256 - (256 % TEMP_PASSWORD_ALPHABET.length)

export type RandomBytes = (length: number) => Uint8Array

/** Readable and strong: 'Kx7m-Pq4t-Zr9w' (about 69 bits). The caller supplies a secure random source. */
export function generateTemporaryPassword(randomBytes: RandomBytes): string {
  const needed = TEMP_PASSWORD_GROUPS * TEMP_PASSWORD_GROUP_LENGTH
  let characters = ''
  while (characters.length < needed) {
    for (const byte of randomBytes(needed)) {
      if (byte < UNBIASED_BYTE_LIMIT && characters.length < needed) characters += TEMP_PASSWORD_ALPHABET[byte % TEMP_PASSWORD_ALPHABET.length]
    }
  }
  const groups = characters.match(new RegExp(`.{${TEMP_PASSWORD_GROUP_LENGTH}}`, 'g')) ?? []
  return groups.join('-')
}
