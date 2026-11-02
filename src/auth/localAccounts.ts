// Local test mode: the team of this browser, with its test passwords in plain text. Never used with the cloud.

import { STORAGE_KEYS } from '@/config/app'
import { LOCAL_TEST_PASSWORDS, SEED_TEAM } from '@/data/seed/team'
import { readStorage, removeStorage, writeStorage } from '@/lib/safeStorage'
import type { Profile } from '@/types'

export interface LocalAccount extends Profile {
  password: string
  /** The one to replace on first login, as the database remembers it. */
  temporaryPassword: string | null
}

const seedAccount = (profile: Profile): LocalAccount => {
  const password = LOCAL_TEST_PASSWORDS[profile.username]
  return { ...profile, password, temporaryPassword: profile.mustChangePassword ? password : null }
}

export function readAccounts(): LocalAccount[] {
  try {
    const stored: unknown = JSON.parse(readStorage(STORAGE_KEYS.localTeam) ?? 'null')
    return Array.isArray(stored) ? (stored as LocalAccount[]) : SEED_TEAM.map(seedAccount)
  } catch {
    return SEED_TEAM.map(seedAccount)
  }
}

export const writeAccounts = (accounts: LocalAccount[]): void => writeStorage(STORAGE_KEYS.localTeam, JSON.stringify(accounts))

export const readSessionId = (): string | null => readStorage(STORAGE_KEYS.localSession)
export const writeSessionId = (id: string): void => writeStorage(STORAGE_KEYS.localSession, id)
export const clearSessionId = (): void => removeStorage(STORAGE_KEYS.localSession)

export function findSessionAccount(): LocalAccount | null {
  const id = readSessionId()
  return readAccounts().find((account) => account.id === id) ?? null
}

/** Without the password fields: what the rest of the app gets. */
export function toProfile(account: LocalAccount): Profile {
  return {
    id: account.id,
    username: account.username,
    email: account.email,
    name: account.name,
    color: account.color,
    role: account.role,
    active: account.active,
    mustChangePassword: account.mustChangePassword,
    hasOwnPassword: !account.mustChangePassword,
    temporaryPasswordExpired: false,
    googleConnected: false,
  }
}
