import { Archive, Search } from 'lucide-react'
import { Chip, Input, SegmentedControl, Select } from '@/components/ui'
import { CLIENT_VIEW_OPTIONS, PLAN_FILTER_OPTIONS, type ClientView, type PlanFilter } from '@/features/clients/config'
import type { ClientFilters } from '@/features/clients/utils/filterClients'

export interface ClientToolbarProps {
  filters: ClientFilters
  archivedCount: number
  view: ClientView
  onViewChange: (view: ClientView) => void
  onQueryChange: (query: string) => void
  onPlanChange: (plan: PlanFilter) => void
  onToggleArchived: () => void
}

/** Search, plan, archived and Cuadrícula/Lista. One row from md; phones put the search on its own row. */
export function ClientToolbar({ filters, archivedCount, view, onViewChange, onQueryChange, onPlanChange, onToggleArchived }: ClientToolbarProps) {
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
        options={PLAN_FILTER_OPTIONS}
        value={filters.plan}
        onChange={onPlanChange}
        containerClassName="min-w-0 flex-1 md:w-52 md:flex-none"
      />
      {archivedCount > 0 && (
        <Chip
          active={filters.archived}
          onClick={onToggleArchived}
          aria-label={`Archivados (${archivedCount})`}
          title="Ver los usuarios archivados"
          className="h-11 shrink-0 gap-1.5"
        >
          <Archive size={15} aria-hidden />
          <span className="hidden lg:inline">Archivados</span>
          <span className="tabular">{archivedCount}</span>
        </Chip>
      )}
      <SegmentedControl ariaLabel="Cómo ver los usuarios" options={CLIENT_VIEW_OPTIONS} value={view} onChange={onViewChange} iconsOnly className="shrink-0" />
    </div>
  )
}
