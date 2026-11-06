// Local test mode: the members' app accounts of this browser, with their test passwords in plain text. Never used with
// the cloud. The demo coaches' login refuses them (localBackend), as the cloud web does.

import { STORAGE_KEYS } from '@/config/app'
import { normalizeUsername } from '@/lib/accountRules'
import { readStorage, writeStorage } from '@/lib/safeStorage'
import { readAccounts } from './localAccounts'

export interface LocalMemberAccount {
  clientId: string
  username: string
  email: string | null
  active: boolean
  mustChangePassword: boolean
  password: string
  /** Epoch ms after which the temporary password no longer works; null once the member chose their own. */
  tempPasswordExpiresAt: number | null
  createdAt: number
}

export function readMemberAccounts(): LocalMemberAccount[] {
  try {
    const stored: unknown = JSON.parse(readStorage(STORAGE_KEYS.localMembers) ?? '[]')
    return Array.isArray(stored) ? (stored as LocalMemberAccount[]) : []
  } catch {
    return []
  }
}

export const writeMemberAccounts = (accounts: LocalMemberAccount[]): void => writeStorage(STORAGE_KEYS.localMembers, JSON.stringify(accounts))

/** The active member account with that username or email and password, if any. */
export function findMemberLogin(identifier: string, password: string): LocalMemberAccount | null {
  const clean = normalizeUsername(identifier)
  return readMemberAccounts().find((account) => account.active && (account.username === clean || account.email === clean) && account.password === password) ?? null
}

// Usernames and emails are one account's, a coach's or a member's (schema.sql: accounts_keep_apart).
export const usernameInUse = (username: string): boolean =>
  readAccounts().some((account) => account.username === username) || readMemberAccounts().some((account) => account.username === username)
export const emailInUse = (email: string): boolean =>
  readAccounts().some((account) => account.email === email) || readMemberAccounts().some((account) => account.email === email)
