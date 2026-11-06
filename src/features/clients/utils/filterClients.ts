import { matchesQuery } from '@/lib/search'
import type { Client } from '@/types'
import type { PlanFilter } from '@/features/clients/config'

export interface ClientFilters {
  query: string
  plan: PlanFilter
  /** true = show only archived clients. */
  archived: boolean
  /** true = only the people shown on a TV right now. */
  onScreen: boolean
}

export const EMPTY_CLIENT_FILTERS: ClientFilters = { query: '', plan: 'all', archived: false, onScreen: false }

const NOBODY: ReadonlySet<string> = new Set()

/** `onScreenIds`: who shows on a TV now (only used with `filters.onScreen`). */
export function filterClients(clients: readonly Client[], filters: ClientFilters, onScreenIds: ReadonlySet<string> = NOBODY): Client[] {
  return clients.filter(
    (c) =>
      c.archived === filters.archived &&
      (!filters.onScreen || onScreenIds.has(c.id)) &&
      (filters.plan === 'all' || c.plan === filters.plan) &&
      matchesQuery(filters.query, c.firstName, c.lastName),
  )
}

export function hasActiveFilters(filters: ClientFilters): boolean {
  return filters.query.trim() !== '' || filters.plan !== 'all' || filters.onScreen
}

export function countArchived(clients: readonly Client[]): number {
  return clients.filter((c) => c.archived).length
}

/** Active people shown on a TV now (archived ones show as nobody there). */
export function countOnScreen(clients: readonly Client[], onScreenIds: ReadonlySet<string>): number {
  return clients.filter((c) => !c.archived && onScreenIds.has(c.id)).length
}
