// Local test mode (no env vars): fake login with demo buttons and a team list in this browser.
// Same rules as the database, so roles behave the same in the UI. Never created when the cloud is set.

import { STORAGE_KEYS } from '@/config/app'
import { SEED_ADMIN, SEED_MONITOR, SEED_TEAM } from '@/data/seed/staff'
import { newId } from '@/lib/ids'
import { accessChangeError } from '@/lib/ownership'
import { readStorage, removeStorage, writeStorage } from '@/lib/safeStorage'
import type { StaffMember } from '@/types'
import type { AuthEvent, AuthService, AuthUser, TeamService } from './types'

const NOT_IN_LOCAL_MODE = 'No disponible en el modo local de pruebas.'

function readTeam(): StaffMember[] {
  try {
    const stored: unknown = JSON.parse(readStorage(STORAGE_KEYS.localTeam) ?? 'null')
    return Array.isArray(stored) ? (stored as StaffMember[]) : [...SEED_TEAM]
  } catch {
    return [...SEED_TEAM]
  }
}

const readSessionId = (): string | null => readStorage(STORAGE_KEYS.localSession)
const toAuthUser = (member: StaffMember): AuthUser => ({ id: member.id, email: member.email })

function findSessionMember(): StaffMember | null {
  const id = readSessionId()
  return readTeam().find((member) => member.id === id) ?? null
}

export function createLocalBackend(): { auth: AuthService; team: TeamService } {
  const authListeners = new Set<(event: AuthEvent) => void>()
  const teamListeners = new Set<() => void>()

  const emitAuth = () => {
    const member = findSessionMember()
    const event: AuthEvent = member ? { type: 'signed-in', user: toAuthUser(member) } : { type: 'signed-out' }
    for (const listener of authListeners) listener(event)
  }

  const writeTeam = (team: StaffMember[]) => {
    writeStorage(STORAGE_KEYS.localTeam, JSON.stringify(team))
    for (const listener of teamListeners) listener()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEYS.localSession) emitAuth()
      if (event.key === STORAGE_KEYS.localTeam) for (const listener of teamListeners) listener()
    })
  }

  const auth: AuthService = {
    isLocal: true,
    getUser: async () => {
      const member = findSessionMember()
      return member ? toAuthUser(member) : null
    },
    onChange: (listener) => {
      authListeners.add(listener)
      return () => authListeners.delete(listener)
    },
    signInWithPassword: () => Promise.reject(new Error(NOT_IN_LOCAL_MODE)),
    signInWithGoogle: () => Promise.reject(new Error(NOT_IN_LOCAL_MODE)),
    requestPasswordReset: () => Promise.reject(new Error(NOT_IN_LOCAL_MODE)),
    updatePassword: () => Promise.reject(new Error(NOT_IN_LOCAL_MODE)),
    signOut: async () => {
      removeStorage(STORAGE_KEYS.localSession)
      emitAuth()
    },
    demoSignIn: async (role) => {
      let team = readTeam()
      let member = team.find((person) => person.role === role && person.active)
      if (!member) {
        // Demo roles may have been changed from Equipo: bring the demo person back.
        member = { ...(role === 'admin' ? SEED_ADMIN : SEED_MONITOR), id: newId('staff') }
        team = [...team, member]
        writeTeam(team)
      }
      writeStorage(STORAGE_KEYS.localSession, member.id)
      emitAuth()
    },
  }

  const team: TeamService = {
    claimProfile: async () => {
      const member = findSessionMember()
      return member?.active ? member : null
    },
    list: async () => readTeam().sort((a, b) => a.name.localeCompare(b.name, 'es')),
    add: async (input, color) => {
      const current = readTeam()
      const email = input.email.trim().toLowerCase()
      if (current.some((member) => member.email === email)) throw new Error('Ya hay alguien en el equipo con ese email.')
      writeTeam([...current, { ...input, email, color, id: newId('staff'), active: true }])
    },
    updateAccess: async (id, patch) => {
      const current = readTeam()
      const error = accessChangeError(current, findSessionMember(), id, patch)
      if (error) throw new Error(error)
      writeTeam(current.map((member) => (member.id === id ? { ...member, ...patch } : member)))
    },
    updateOwnProfile: async (id, patch) => {
      if (readSessionId() !== id) throw new Error('No tienes permiso para hacer esto.')
      writeTeam(readTeam().map((member) => (member.id === id ? { ...member, ...patch } : member)))
    },
    subscribe: (listener) => {
      teamListeners.add(listener)
      return () => teamListeners.delete(listener)
    },
  }

  return { auth, team }
}
