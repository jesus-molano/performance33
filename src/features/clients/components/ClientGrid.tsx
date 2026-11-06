import type { Client } from '@/types'
import { placementsOf, type ClientPlacements } from '@/features/clients/utils/screenPlacements'
import { ClientCard } from './ClientCard'

export interface ClientGridProps {
  clients: Client[]
  pinnedCounts: Record<string, number>
  /** Where each user shows on the TVs now. */
  placements: ClientPlacements
  onEdit: (client: Client) => void
}

export function ClientGrid({ clients, pinnedCounts, placements, onEdit }: ClientGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {clients.map((client) => (
        <li key={client.id} className="flex min-w-0">
          <ClientCard client={client} importantCount={pinnedCounts[client.id] ?? 0} placements={placementsOf(placements, client.id)} onEdit={onEdit} />
        </li>
      ))}
    </ul>
  )
}
