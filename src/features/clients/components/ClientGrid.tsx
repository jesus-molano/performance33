import type { Client } from '@/types'
import { ClientCard } from './ClientCard'

export interface ClientGridProps {
  clients: Client[]
  pinnedCounts: Record<string, number>
  onEdit: (client: Client) => void
}

export function ClientGrid({ clients, pinnedCounts, onEdit }: ClientGridProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {clients.map((client) => (
        <li key={client.id} className="flex">
          <ClientCard client={client} importantCount={pinnedCounts[client.id] ?? 0} onEdit={onEdit} />
        </li>
      ))}
    </ul>
  )
}
