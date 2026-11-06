import { Card } from '@/components/ui'
import { cn } from '@/lib/cn'
import { CLIENT_LIST_COLUMN_TITLES, CLIENT_ROW_ACTIONS_WIDTH, CLIENT_ROW_COLUMNS } from '@/features/clients/config'
import { placementsOf } from '@/features/clients/utils/screenPlacements'
import type { ClientGridProps } from './ClientGrid'
import { ClientRow } from './ClientRow'

/** Lista view: same data as the cards, one compact row per client. */
export function ClientList({ clients, pinnedCounts, placements, onEdit }: ClientGridProps) {
  return (
    <Card padding="none">
      <div aria-hidden className="hidden items-center gap-1 border-b border-line pr-2 xl:flex">
        <div className={cn(CLIENT_ROW_COLUMNS, 'min-w-0 flex-1 py-2 pl-4 text-xs font-semibold tracking-wide text-fg-subtle uppercase')}>
          {CLIENT_LIST_COLUMN_TITLES.map((title) => (
            <span key={title}>{title}</span>
          ))}
        </div>
        <div className={cn(CLIENT_ROW_ACTIONS_WIDTH, 'shrink-0')} />
      </div>
      <ul className="divide-y divide-line">
        {clients.map((client) => (
          <ClientRow key={client.id} client={client} importantCount={pinnedCounts[client.id] ?? 0} placements={placementsOf(placements, client.id)} onEdit={onEdit} />
        ))}
      </ul>
    </Card>
  )
}
