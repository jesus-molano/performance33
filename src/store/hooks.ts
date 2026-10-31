// Selector hooks. Components read data ONLY through these (stable references, minimal re-renders).

import { useMemo } from 'react'
import { useStore } from 'zustand'
import { getClientPrograms, getCurrentProgram } from '@/lib/program'
import { getFullLibrary } from '@/lib/search'
import type { AnyLibraryExercise, AppData, Branding, Client, ClientNote, Coach, Program } from '@/types'
import { useAppStore } from './appStore'
import { countPinnedNotes, findClient, findCoach, findProgram, selectClientNotes, sortClients } from './selectors'
import type { AppActions } from './types'
import { useUiStore, type SaveStatus } from './uiStore'

/** Generic escape hatch: select a stable slice of the data. */
export function useAppData<T>(selector: (data: AppData) => T): T {
  return useAppStore((s) => selector(s.data))
}

/** All store actions (stable functions, never cause re-renders). */
export function useAppActions(): AppActions {
  return useAppStore.getState()
}

export const useCoaches = (): Coach[] => useAppStore((s) => s.data.coaches)
export const useCoach = (id: string | null): Coach | null => useAppStore((s) => findCoach(s.data, id))
export const useCurrentCoachId = (): string | null => useUiStore((s) => s.currentCoachId)
export const useCurrentCoach = (): Coach | null => useCoach(useCurrentCoachId())

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

/** clientId → number of pinned alert notes (for list badges). */
export function usePinnedNoteCounts(): Record<string, number> {
  const notes = useAppStore((s) => s.data.notes)
  return useMemo(() => countPinnedNotes(notes), [notes])
}

export const useBranding = (): Branding => useAppStore((s) => s.data.branding)

/** Built-in + custom exercises (custom first, flagged custom: true). */
export function useExerciseLibrary(): AnyLibraryExercise[] {
  const custom = useAppStore((s) => s.data.customExercises)
  return useMemo(() => getFullLibrary(custom), [custom])
}

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
