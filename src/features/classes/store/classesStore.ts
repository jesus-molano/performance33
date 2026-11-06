// What this window knows of the classes. A store of its own, outside the routine data: never in undo, never in backups.

import { create } from 'zustand'
import type { GymDate } from '@shared/booking'
import type { ClassDay, ClassSchedule, ClientClasses } from '@/features/classes/types'

export type ResourceStatus = 'loading' | 'ready' | 'error'

export interface Resource<T> {
  status: ResourceStatus
  /** The last good read (kept while reloading or after a failed reload). */
  data: T | null
}

export type ClassesKey = { kind: 'day'; date: GymDate } | { kind: 'schedule' } | { kind: 'client'; clientId: string }

export interface ClassesState {
  days: Record<GymDate, Resource<ClassDay>>
  clients: Record<string, Resource<ClientClasses>>
  schedule: Resource<ClassSchedule>
}

export const EMPTY_RESOURCE: Resource<never> = { status: 'loading', data: null }

const initialState = (): ClassesState => ({ days: {}, clients: {}, schedule: EMPTY_RESOURCE })

export const useClassesStore = create<ClassesState>()(initialState)

export const keyId = (key: ClassesKey): string =>
  key.kind === 'day' ? `day:${key.date}` : key.kind === 'client' ? `client:${key.clientId}` : 'schedule'

export function readResource(state: ClassesState, key: ClassesKey): Resource<unknown> {
  if (key.kind === 'day') return state.days[key.date] ?? EMPTY_RESOURCE
  if (key.kind === 'client') return state.clients[key.clientId] ?? EMPTY_RESOURCE
  return state.schedule
}

export function writeResource(key: ClassesKey, resource: Resource<unknown>): void {
  useClassesStore.setState((state) => {
    if (key.kind === 'day') return { days: { ...state.days, [key.date]: resource as Resource<ClassDay> } }
    if (key.kind === 'client') return { clients: { ...state.clients, [key.clientId]: resource as Resource<ClientClasses> } }
    return { schedule: resource as Resource<ClassSchedule> }
  })
}

/** Back to knowing nothing (the session ended). */
export function resetClassesState(): void {
  useClassesStore.setState(initialState())
}
