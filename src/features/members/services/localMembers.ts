// Local test mode: members' app accounts kept in this browser, with the rules of member-accounts (memberRules) and of
// schema.sql (one account per user, usernames and emails apart from the team's, 72 h temporary passwords).

import { STORAGE_KEYS } from '@/config/app'
import { emailInUse, readMemberAccounts, usernameInUse, writeMemberAccounts, type LocalMemberAccount } from '@/auth'
import { generateTemporaryPassword, type AccountErrorCode } from '@/lib/accountRules'
import { pickFreeUsername } from '@/lib/memberRules'
import type { Client } from '@/types'
import { MEMBER_TEMP_PASSWORD_HOURS } from '@/features/members/config/memberApp'
import type { MemberAccess } from '@/features/members/types'
import { giveAccessErrors } from '@/features/members/utils/giveAccess'
import { memberErrorMessage } from '@/features/members/utils/messages'
import type { MemberAccessService } from './types'

const HOUR_MS = 3_600_000

export interface LocalMembersDeps {
  clients: () => readonly Client[]
  /** The signed-in coach; null = nobody, nothing is allowed. */
  profileId: () => string | null
  now?: () => number
}

const refuse = (code: AccountErrorCode): never => {
  throw new Error(memberErrorMessage(code))
}

const toAccess = ({ clientId, username, email, active, mustChangePassword, tempPasswordExpiresAt, createdAt }: LocalMemberAccount): MemberAccess => ({
  clientId,
  username,
  email,
  active,
  mustChangePassword,
  tempPasswordExpiresAt,
  createdAt,
})

export function createLocalMembers({ clients, profileId, now = Date.now }: LocalMembersDeps): MemberAccessService {
  const listeners = new Set<() => void>()
  const notify = () => {
    for (const listener of listeners) listener()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEYS.localMembers) notify()
    })
  }

  const save = (accounts: LocalMemberAccount[]) => {
    writeMemberAccounts(accounts)
    notify()
  }
  const requireCoach = () => (profileId() ? null : refuse('unauthorized'))
  const findAccount = (clientId: string) => readMemberAccounts().find((account) => account.clientId === clientId) ?? refuse('not_found')
  const patch = (clientId: string, change: Partial<LocalMemberAccount>) =>
    save(readMemberAccounts().map((account) => (account.clientId === clientId ? { ...account, ...change } : account)))
  const temporary = () => ({
    password: generateTemporaryPassword((length) => crypto.getRandomValues(new Uint8Array(length))),
    expiresAt: now() + MEMBER_TEMP_PASSWORD_HOURS * HOUR_MS,
  })

  return {
    load: async (clientId) => {
      const account = readMemberAccounts().find((candidate) => candidate.clientId === clientId)
      return account ? toAccess(account) : null
    },
    give: async (clientId, input) => {
      requireCoach()
      const client = clients().find((candidate) => candidate.id === clientId) ?? refuse('not_found')
      if (client.archived) refuse('archived')
      if (readMemberAccounts().some((account) => account.clientId === clientId)) refuse('has_access')
      const draft = { username: input.username ?? '', email: input.email ?? '', usernameEdited: input.username !== null }
      if (Object.keys(giveAccessErrors(draft)).length) refuse('invalid_input')
      if (input.username && usernameInUse(input.username)) refuse('username_taken')
      if (input.email && emailInUse(input.email)) refuse('email_taken')
      const username = input.username ?? (await pickFreeUsername(`${client.firstName} ${client.lastName}`, usernameInUse)) ?? refuse('username_taken')
      const { password, expiresAt } = temporary()
      save([
        ...readMemberAccounts(),
        { clientId, username, email: input.email, active: true, mustChangePassword: true, password, tempPasswordExpiresAt: expiresAt, createdAt: now() },
      ])
      return { username, temporaryPassword: password }
    },
    resetPassword: async (clientId) => {
      requireCoach()
      const account = findAccount(clientId)
      const { password, expiresAt } = temporary()
      patch(clientId, { password, mustChangePassword: true, tempPasswordExpiresAt: expiresAt })
      return { username: account.username, temporaryPassword: password }
    },
    setActive: async (clientId, active) => {
      requireCoach()
      findAccount(clientId)
      patch(clientId, { active })
    },
    remove: async (clientId) => {
      requireCoach()
      findAccount(clientId)
      save(readMemberAccounts().filter((account) => account.clientId !== clientId))
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
