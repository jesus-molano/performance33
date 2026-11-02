// Local test mode: the same team service as the cloud, with the same rules, and no server.

import { accountErrorMessage } from '@/lib/accountMessages'
import { findAccountConflict, generateTemporaryPassword, parseNewAccount, type AccessChange } from '@/lib/accountRules'
import { newId } from '@/lib/ids'
import { accessChangeError, isActiveAdmin } from '@/lib/ownership'
import type { TeamMember } from '@/types'
import { findSessionAccount, readAccounts, readSessionId, toProfile, writeAccounts, type LocalAccount } from './localAccounts'
import { NOT_CHANGED_MESSAGE } from './messages'
import type { TeamService } from './types'

const newTemporaryPassword = (): string => generateTemporaryPassword((length) => crypto.getRandomValues(new Uint8Array(length)))
const sortByName = <T extends TeamMember>(team: T[]): T[] => team.sort((a, b) => a.name.localeCompare(b.name, 'es'))

function refuseIf(message: string | null): void {
  if (message) throw new Error(message)
}

const requireAdmin = () => refuseIf(isActiveAdmin(findSessionAccount()) ? null : accountErrorMessage('forbidden'))
const requireAllowed = (id: string, change: AccessChange) => refuseIf(accessChangeError(readAccounts(), findSessionAccount(), id, change))

export function createLocalTeam(notify: () => void, subscribe: TeamService['subscribe']): TeamService {
  const save = (accounts: LocalAccount[]) => {
    writeAccounts(accounts)
    notify()
  }
  const patch = (id: string, change: Partial<LocalAccount>) => save(readAccounts().map((account) => (account.id === id ? { ...account, ...change } : account)))

  return {
    getOwnProfile: async () => {
      const account = findSessionAccount()
      return account?.active ? toProfile(account) : null
    },
    list: async () =>
      sortByName(readAccounts()).map(({ id, name, color, role, active }) => ({ id, name, color, role, active })),
    updateOwnProfile: async (id, change) => {
      refuseIf(readSessionId() === id ? null : accountErrorMessage('forbidden'))
      patch(id, change)
    },
    finishPasswordChange: async () => {
      const account = findSessionAccount()
      if (!account || account.password === account.temporaryPassword) throw new Error(NOT_CHANGED_MESSAGE)
      patch(account.id, { mustChangePassword: false, temporaryPassword: null })
    },
    subscribe,

    listAccounts: async () => {
      requireAdmin()
      return sortByName(readAccounts()).map(toProfile)
    },
    createAccount: async (input) => {
      requireAdmin()
      const account = parseNewAccount(input)
      if (!account) throw new Error(accountErrorMessage('invalid_input'))
      const accounts = readAccounts()
      const conflict = findAccountConflict(accounts, account)
      if (conflict) throw new Error(accountErrorMessage(conflict))
      const password = newTemporaryPassword()
      save([...accounts, { ...account, color: input.color, id: newId('profile'), active: true, mustChangePassword: true, password, temporaryPassword: password }])
      return password
    },
    resetPassword: async (id) => {
      requireAllowed(id, { resetPassword: true })
      const password = newTemporaryPassword()
      patch(id, { password, temporaryPassword: password, mustChangePassword: true })
      return password
    },
    setRole: async (id, role) => {
      requireAllowed(id, { role })
      patch(id, { role })
    },
    setActive: async (id, active) => {
      requireAllowed(id, { active })
      patch(id, { active })
    },
    deleteAccount: async (id) => {
      requireAllowed(id, { remove: true })
      save(readAccounts().filter((account) => account.id !== id))
    },
  }
}
