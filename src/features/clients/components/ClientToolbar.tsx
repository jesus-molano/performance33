import { Archive, Monitor, Search } from 'lucide-react'
import { Chip, Input, SegmentedControl, Select } from '@/components/ui'
import { useIsMobile } from '@/hooks'
import { CLIENT_PLACEMENT_COPY, CLIENT_VIEW_OPTIONS, PLAN_FILTER_OPTIONS, PLAN_FILTER_OPTIONS_SHORT, type ClientView, type PlanFilter } from '@/features/clients/config'
import type { ClientFilters } from '@/features/clients/utils/filterClients'

export interface ClientToolbarProps {
  filters: ClientFilters
  archivedCount: number
  /** People on a TV now: the 'En pantalla' chip (hidden at 0 and among the archived). */
  onScreenCount: number
  view: ClientView
  onViewChange: (view: ClientView) => void
  onQueryChange: (query: string) => void
  onPlanChange: (plan: PlanFilter) => void
  onToggleArchived: () => void
  onToggleOnScreen: () => void
}

/** Search, plan, 'En pantalla', archived and Cuadrícula/Lista. One row from md (chip words from xl); phones put the search on its own row. */
export function ClientToolbar({
  filters,
  archivedCount,
  onScreenCount,
  view,
  onViewChange,
  onQueryChange,
  onPlanChange,
  onToggleArchived,
  onToggleOnScreen,
}: ClientToolbarProps) {
  const isMobile = useIsMobile()
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-3">
      <Input
        type="search"
        aria-label="Buscar usuario"
        placeholder="Buscar por nombre…"
        leftIcon={Search}
        value={filters.query}
        onChange={(e) => onQueryChange(e.target.value)}
        nativeUndo
        containerClassName="w-full md:w-auto md:min-w-0 md:flex-1"
      />
      <Select
        aria-label="Filtrar por plan"
        options={isMobile ? PLAN_FILTER_OPTIONS_SHORT : PLAN_FILTER_OPTIONS}
        value={filters.plan}
        onChange={onPlanChange}
        containerClassName="min-w-0 flex-1 md:w-52 md:flex-none"
      />
      {onScreenCount > 0 && !filters.archived && (
        <Chip
          active={filters.onScreen}
          onClick={onToggleOnScreen}
          aria-label={CLIENT_PLACEMENT_COPY.filterLabel(onScreenCount)}
          title={CLIENT_PLACEMENT_COPY.filterTip}
          className="h-11 shrink-0 gap-1.5"
        >
          <Monitor size={15} aria-hidden />
          <span className="hidden xl:inline">{CLIENT_PLACEMENT_COPY.filter}</span>
          <span className="tabular">{onScreenCount}</span>
        </Chip>
      )}
      {archivedCount > 0 && (
        <Chip
          active={filters.archived}
          onClick={onToggleArchived}
          aria-label={`Archivados (${archivedCount})`}
          title="Ver los usuarios archivados"
          className="h-11 shrink-0 gap-1.5"
        >
          <Archive size={15} aria-hidden />
          <span className="hidden xl:inline">Archivados</span>
          <span className="tabular">{archivedCount}</span>
        </Chip>
      )}
      <SegmentedControl ariaLabel="Cómo ver los usuarios" options={CLIENT_VIEW_OPTIONS} value={view} onChange={onViewChange} iconsOnly className="shrink-0" />
    </div>
  )
}
