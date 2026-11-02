// Local test mode (no env vars): the same login form, against test accounts kept in this browser.
// Same rules as the server, so everything behaves the same in the UI. Never created when the cloud is set.

import { STORAGE_KEYS } from '@/config/app'
import { accountErrorMessage } from '@/lib/accountMessages'
import { isEmailIdentifier, normalizeUsername } from '@/lib/accountRules'
import { clearSessionId, findSessionAccount, readAccounts, writeAccounts, writeSessionId } from './localAccounts'
import { createLocalTeam } from './localTeam'
import { SamePasswordError } from './messages'
import { signInMethodsFrom } from './signInMethods'
import type { AuthEvent, AuthService, AuthUser, TeamService } from './types'

const NOT_IN_LOCAL_MODE = 'No disponible en el modo local de pruebas.'

const toAuthUser = (account: { id: string; email: string | null }): AuthUser => ({ id: account.id, email: account.email })

export function createLocalBackend(): { auth: AuthService; team: TeamService } {
  const authListeners = new Set<(event: AuthEvent) => void>()
  const teamListeners = new Set<() => void>()
  const notifyTeam = () => {
    for (const listener of teamListeners) listener()
  }

  const emitAuth = () => {
    const account = findSessionAccount()
    const event: AuthEvent = account ? { type: 'signed-in', user: toAuthUser(account) } : { type: 'signed-out' }
    for (const listener of authListeners) listener(event)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEYS.localSession) emitAuth()
      if (event.key === STORAGE_KEYS.localTeam) notifyTeam()
    })
  }

  const auth: AuthService = {
    isLocal: true,
    getUser: async () => {
      const account = findSessionAccount()
      return account ? toAuthUser(account) : null
    },
    onChange: (listener) => {
      authListeners.add(listener)
      return () => authListeners.delete(listener)
    },
    signIn: async (identifier, password) => {
      const clean = normalizeUsername(identifier)
      const byEmail = isEmailIdentifier(clean)
      const account = readAccounts().find((candidate) => candidate.active && (byEmail ? candidate.email === clean : candidate.username === clean))
      if (account?.password !== password) throw new Error(accountErrorMessage('invalid_credentials'))
      writeSessionId(account.id)
      emitAuth()
    },
    signInWithGoogle: () => Promise.reject(new Error(NOT_IN_LOCAL_MODE)),
    changePassword: async (password) => {
      const account = findSessionAccount()
      if (!account) throw new Error(accountErrorMessage('unauthorized'))
      if (account.password === password) throw new SamePasswordError()
      writeAccounts(readAccounts().map((other) => (other.id === account.id ? { ...other, password } : other)))
    },
    verifyPassword: async (password) => findSessionAccount()?.password === password,
    getSignInMethods: async (hasOwnPassword) => signInMethodsFrom(['email'], hasOwnPassword),
    connectGoogle: () => Promise.reject(new Error(NOT_IN_LOCAL_MODE)),
    disconnectGoogle: () => Promise.reject(new Error(NOT_IN_LOCAL_MODE)),
    signOut: async () => {
      clearSessionId()
      emitAuth()
    },
  }

  const team = createLocalTeam(notifyTeam, (listener) => {
    teamListeners.add(listener)
    return () => teamListeners.delete(listener)
  })

  return { auth, team }
}
