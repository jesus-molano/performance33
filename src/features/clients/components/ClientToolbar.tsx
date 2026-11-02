import { Archive, Search } from 'lucide-react'
import { Chip, Input, SegmentedControl, Select } from '@/components/ui'
import { CLIENT_VIEW_OPTIONS, PLAN_FILTER_OPTIONS, PLAN_SELECT_OPTIONS, type ClientView, type PlanFilter } from '@/features/clients/config'
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

/**
 * Search, plan, archived and Cuadrícula/Lista. Phones: search on its own row, then one row with
 * a plan selector and icons. From md the plans are chips, wrapping rather than scrolling.
 */
export function ClientToolbar({ filters, archivedCount, view, onViewChange, onQueryChange, onPlanChange, onToggleArchived }: ClientToolbarProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 md:gap-3 lg:flex-nowrap">
      <Input
        type="search"
        aria-label="Buscar usuario"
        placeholder="Buscar por nombre…"
        leftIcon={Search}
        value={filters.query}
        onChange={(e) => onQueryChange(e.target.value)}
        nativeUndo
        containerClassName="w-full md:w-auto md:min-w-0 md:flex-1 lg:w-72 lg:flex-none"
      />
      <Select
        aria-label="Filtrar por plan"
        options={PLAN_SELECT_OPTIONS}
        value={filters.plan}
        onChange={onPlanChange}
        containerClassName="min-w-0 flex-1 md:hidden"
      />
      {archivedCount > 0 && (
        <Chip
          active={filters.archived}
          onClick={onToggleArchived}
          aria-label={`Archivados (${archivedCount})`}
          title="Ver los usuarios archivados"
          className="h-11 shrink-0 gap-1.5 md:order-3"
        >
          <Archive size={15} aria-hidden />
          <span className="hidden md:inline">Archivados</span>
          <span className="tabular">{archivedCount}</span>
        </Chip>
      )}
      <SegmentedControl ariaLabel="Cómo ver los usuarios" options={CLIENT_VIEW_OPTIONS} value={view} onChange={onViewChange} iconsOnMobile className="shrink-0 lg:order-last" />
      <div className="hidden flex-wrap gap-2 md:order-2 md:flex" role="group" aria-label="Filtrar por plan">
        {PLAN_FILTER_OPTIONS.map((option) => (
          <Chip key={option.value} active={filters.plan === option.value} onClick={() => onPlanChange(option.value)} className="h-11 shrink-0">
            {option.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}
