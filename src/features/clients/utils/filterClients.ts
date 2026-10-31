import { matchesQuery } from '../../../lib/search'
import type { Client } from '../../../types'
import type { PlanFilter } from '../config'

export interface ClientFilters {
  query: string
  plan: PlanFilter
  /** true = show only archived clients. */
  archived: boolean
}

export const EMPTY_CLIENT_FILTERS: ClientFilters = { query: '', plan: 'all', archived: false }

export function filterClients(clients: readonly Client[], filters: ClientFilters): Client[] {
  return clients.filter(
    (c) =>
      c.archived === filters.archived &&
      (filters.plan === 'all' || c.plan === filters.plan) &&
      matchesQuery(filters.query, c.firstName, c.lastName),
  )
}

export function hasActiveFilters(filters: ClientFilters): boolean {
  return filters.query.trim() !== '' || filters.plan !== 'all'
}

export function countArchived(clients: readonly Client[]): number {
  return clients.filter((c) => c.archived).length
}
