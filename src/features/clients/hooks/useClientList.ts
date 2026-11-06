import { useCallback, useMemo, useState } from 'react'
import { useClients, usePinnedNoteCounts } from '@/store'
import type { Client } from '@/types'
import type { PlanFilter } from '@/features/clients/config'
import {
  countArchived,
  countOnScreen,
  EMPTY_CLIENT_FILTERS,
  filterClients,
  hasActiveFilters,
  type ClientFilters,
} from '@/features/clients/utils/filterClients'
import type { ClientPlacements } from '@/features/clients/utils/screenPlacements'
import { useClientPlacements } from './useClientPlacements'

export interface ClientListApi {
  filters: ClientFilters
  setQuery: (query: string) => void
  setPlan: (plan: PlanFilter) => void
  toggleArchived: () => void
  toggleOnScreen: () => void
  clearFilters: () => void
  visible: Client[]
  activeCount: number
  archivedCount: number
  /** Active people on a TV now ('En pantalla'). */
  onScreenCount: number
  isFiltering: boolean
  pinnedCounts: Record<string, number>
  placements: ClientPlacements
}

/** Clients page state: search + plan filter + archived and 'En pantalla' toggles over the sorted client list. */
export function useClientList(): ClientListApi {
  const clients = useClients({ includeArchived: true })
  const pinnedCounts = usePinnedNoteCounts()
  const placements = useClientPlacements()
  const [filters, setFilters] = useState<ClientFilters>(EMPTY_CLIENT_FILTERS)
  const archivedCount = useMemo(() => countArchived(clients), [clients])
  const onScreenIds = useMemo(() => new Set(placements.keys()), [placements])
  const onScreenCount = useMemo(() => countOnScreen(clients, onScreenIds), [clients, onScreenIds])
  // With nobody archived (or on a TV) left, its toggle is gone: go back to everyone.
  if (filters.archived && archivedCount === 0) setFilters({ ...filters, archived: false })
  if (filters.onScreen && onScreenCount === 0) setFilters({ ...filters, onScreen: false })

  const setQuery = useCallback((query: string) => setFilters((f) => ({ ...f, query })), [])
  const setPlan = useCallback((plan: PlanFilter) => setFilters((f) => ({ ...f, plan })), [])
  // Archived people are on no TV: the two views do not mix.
  const toggleArchived = useCallback(() => setFilters((f) => ({ ...f, archived: !f.archived, onScreen: false })), [])
  const toggleOnScreen = useCallback(() => setFilters((f) => ({ ...f, onScreen: !f.onScreen })), [])
  const clearFilters = useCallback(() => setFilters((f) => ({ ...EMPTY_CLIENT_FILTERS, archived: f.archived })), [])

  const visible = useMemo(() => filterClients(clients, filters, onScreenIds), [clients, filters, onScreenIds])

  return {
    filters,
    setQuery,
    setPlan,
    toggleArchived,
    toggleOnScreen,
    clearFilters,
    visible,
    activeCount: clients.length - archivedCount,
    archivedCount,
    onScreenCount,
    isFiltering: hasActiveFilters(filters),
    pinnedCounts,
    placements,
  }
}
