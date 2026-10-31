import { useCallback, useMemo, useState } from 'react'
import { useClients, usePinnedNoteCounts } from '../../../store'
import type { Client } from '../../../types'
import type { PlanFilter } from '../config'
import { countArchived, EMPTY_CLIENT_FILTERS, filterClients, hasActiveFilters, type ClientFilters } from '../utils/filterClients'

export interface ClientListApi {
  filters: ClientFilters
  setQuery: (query: string) => void
  setPlan: (plan: PlanFilter) => void
  toggleArchived: () => void
  clearFilters: () => void
  visible: Client[]
  activeCount: number
  archivedCount: number
  isFiltering: boolean
  pinnedCounts: Record<string, number>
}

/** Clients page state: search + plan filter + archived toggle over the sorted client list. */
export function useClientList(): ClientListApi {
  const clients = useClients({ includeArchived: true })
  const pinnedCounts = usePinnedNoteCounts()
  const [filters, setFilters] = useState<ClientFilters>(EMPTY_CLIENT_FILTERS)

  const setQuery = useCallback((query: string) => setFilters((f) => ({ ...f, query })), [])
  const setPlan = useCallback((plan: PlanFilter) => setFilters((f) => ({ ...f, plan })), [])
  const toggleArchived = useCallback(() => setFilters((f) => ({ ...f, archived: !f.archived })), [])
  const clearFilters = useCallback(() => setFilters((f) => ({ ...EMPTY_CLIENT_FILTERS, archived: f.archived })), [])

  const visible = useMemo(() => filterClients(clients, filters), [clients, filters])
  const archivedCount = useMemo(() => countArchived(clients), [clients])

  return {
    filters,
    setQuery,
    setPlan,
    toggleArchived,
    clearFilters,
    visible,
    activeCount: clients.length - archivedCount,
    archivedCount,
    isFiltering: hasActiveFilters(filters),
    pinnedCounts,
  }
}
