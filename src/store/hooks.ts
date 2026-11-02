// Selector hooks. Components read data ONLY through these (stable references, minimal re-renders).

import { useMemo } from 'react'
import { useStore } from 'zustand'
import { getClientPrograms, getCurrentProgram } from '@/lib/program'
import type { AppData, Branding, Client, ClientNote, LibraryExercise, Profile, Program, TeamMember } from '@/types'
import { useAppStore } from './appStore'
import { countPinnedNotes, findClient, findProgram, selectClientNotes, sortClients } from './selectors'
import type { AppActions } from './types'
import { useSessionStore, type SessionStatus } from './sessionStore'
import { useUiStore, type SaveStatus } from './uiStore'

/** Generic escape hatch: select a stable slice of the data. */
export function useAppData<T>(selector: (data: AppData) => T): T {
  return useAppStore((s) => selector(s.data))
}

/** All store actions (stable functions, never cause re-renders). */
export function useAppActions(): AppActions {
  return useAppStore.getState()
}

export const useSessionStatus = (): SessionStatus => useSessionStore((s) => s.status)
/** The signed-in coach (null until the session is ready). */
export const useCurrentProfile = (): Profile | null => useSessionStore((s) => s.profile)
export const useIsAdmin = (): boolean => useSessionStore((s) => s.profile?.role === 'admin')
export const useSessionNotice = (): string | null => useSessionStore((s) => s.notice)
export const useSessionEmail = (): string | null => useSessionStore((s) => s.email)
/** Everyone on the team, deactivated people included. */
export const useTeam = (): TeamMember[] => useSessionStore((s) => s.team)
export const useTeamMember = (id: string | null): TeamMember | null =>
  useSessionStore((s) => s.team.find((member) => member.id === id) ?? null)

export function useClients(opts: { includeArchived?: boolean } = {}): Client[] {
  const clients = useAppStore((s) => s.data.clients)
  const includeArchived = opts.includeArchived ?? false
  return useMemo(() => sortClients(clients, includeArchived), [clients, includeArchived])
}

export const useClient = (id: string): Client | null => useAppStore((s) => findClient(s.data, id))
export const useProgram = (id: string): Program | null => useAppStore((s) => findProgram(s.data, id))

/** Newest start date first. */
export function useClientPrograms(clientId: string): Program[] {
  const programs = useAppStore((s) => s.data.programs)
  return useMemo(() => getClientPrograms(clientId, programs), [clientId, programs])
}

export function useCurrentProgram(clientId: string): Program | null {
  return useAppStore((s) => {
    const client = findClient(s.data, clientId)
    return client ? getCurrentProgram(client, s.data.programs) : null
  })
}

/** Pinned first, then newest first. */
export function useClientNotes(clientId: string): ClientNote[] {
  const notes = useAppStore((s) => s.data.notes)
  return useMemo(() => selectClientNotes(notes, clientId), [notes, clientId])
}

export function usePinnedNotes(clientId: string): ClientNote[] {
  const notes = useClientNotes(clientId)
  return useMemo(() => notes.filter((n) => n.pinned), [notes])
}

/** clientId → number of important notifications (pinned notes) (for list badges). */
export function usePinnedNoteCounts(): Record<string, number> {
  const notes = useAppStore((s) => s.data.notes)
  return useMemo(() => countPinnedNotes(notes), [notes])
}

export const useBranding = (): Branding => useAppStore((s) => s.data.branding)

/** The whole exercise library. */
export const useExerciseLibrary = (): LibraryExercise[] => useAppStore((s) => s.data.library)

/** The link saved on a library exercise, if it has one and still exists. */
export const useExerciseLibraryLink = (id: string | null): string | null =>
  useAppStore((s) => (id ? (s.data.library.find((exercise) => exercise.id === id)?.link ?? null) : null))

export function useSaveStatus(): { status: SaveStatus; lastSavedAt: number | null } {
  const status = useUiStore((s) => s.saveStatus)
  const lastSavedAt = useUiStore((s) => s.lastSavedAt)
  return { status, lastSavedAt }
}

/** Undo/redo availability (re-renders only when it changes). */
export function useHistoryState(): { canUndo: boolean; canRedo: boolean } {
  const canUndo = useStore(useAppStore.temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(useAppStore.temporal, (s) => s.futureStates.length > 0)
  return { canUndo, canRedo }
}
