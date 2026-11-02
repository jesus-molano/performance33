import { Archive, Search } from 'lucide-react'
import { Chip, Input, SegmentedControl } from '@/components/ui'
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

/** Search box + Cuadrícula/Lista + plan filter chips + archived toggle. */
export function ClientToolbar({ filters, archivedCount, view, onViewChange, onQueryChange, onPlanChange, onToggleArchived }: ClientToolbarProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 lg:flex-nowrap">
      <Input
        type="search"
        aria-label="Buscar cliente"
        placeholder="Buscar por nombre…"
        leftIcon={Search}
        value={filters.query}
        onChange={(e) => onQueryChange(e.target.value)}
        nativeUndo
        containerClassName="min-w-0 flex-1 lg:w-72 lg:flex-none"
      />
      <SegmentedControl ariaLabel="Cómo ver los clientes" options={CLIENT_VIEW_OPTIONS} value={view} onChange={onViewChange} iconsOnMobile className="shrink-0 lg:order-last" />
      <div className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:w-auto lg:min-w-0 lg:flex-1 lg:px-0 lg:pb-0" role="group" aria-label="Filtrar por plan">
        {PLAN_FILTER_OPTIONS.map((option) => (
          <Chip key={option.value} active={filters.plan === option.value} onClick={() => onPlanChange(option.value)} className="h-11 shrink-0">
            {option.label}
          </Chip>
        ))}
        {archivedCount > 0 && (
          <Chip active={filters.archived} onClick={onToggleArchived} className="h-11 shrink-0 gap-1.5">
            <Archive size={15} aria-hidden />
            Archivados ({archivedCount})
          </Chip>
        )}
      </div>
    </div>
  )
}
