import { Archive, Search } from 'lucide-react'
import { Chip, Input } from '@/components/ui'
import { PLAN_FILTER_OPTIONS, type PlanFilter } from '@/features/clients/config'
import type { ClientFilters } from '@/features/clients/utils/filterClients'

export interface ClientToolbarProps {
  filters: ClientFilters
  archivedCount: number
  onQueryChange: (query: string) => void
  onPlanChange: (plan: PlanFilter) => void
  onToggleArchived: () => void
}

/** Search box + plan filter chips + archived toggle. */
export function ClientToolbar({ filters, archivedCount, onQueryChange, onPlanChange, onToggleArchived }: ClientToolbarProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
      <Input
        type="search"
        aria-label="Buscar cliente"
        placeholder="Buscar por nombre…"
        leftIcon={Search}
        value={filters.query}
        onChange={(e) => onQueryChange(e.target.value)}
        nativeUndo
        containerClassName="lg:w-80"
      />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:px-0 lg:pb-0" role="group" aria-label="Filtrar por plan">
        {PLAN_FILTER_OPTIONS.map((option) => (
          <Chip key={option.value} active={filters.plan === option.value} onClick={() => onPlanChange(option.value)} className="h-11 shrink-0">
            {option.label}
          </Chip>
        ))}
        {archivedCount > 0 && (
          <Chip active={filters.archived} onClick={onToggleArchived} className="h-11 shrink-0 gap-1.5 lg:ml-auto">
            <Archive size={15} aria-hidden />
            Archivados ({archivedCount})
          </Chip>
        )}
      </div>
    </div>
  )
}
