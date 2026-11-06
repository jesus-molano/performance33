import { MonitorOff } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Client } from '@/types'
import { CLIENT_PLACEMENT_COPY } from '@/features/clients/config'
import { useClientScreenPlacement } from '@/features/clients/hooks/useClientScreenPlacement'
import { ScreenPlacementBadge } from './ScreenPlacementBadge'

/** On the user's page: where they show on the TVs now and 'Quitar de la pantalla' (nothing when on none). */
export function ClientScreenPlacement({ client }: { client: Pick<Client, 'id' | 'firstName' | 'archived'> }) {
  const { placements, remove } = useClientScreenPlacement(client)
  if (!placements.length) return null
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <ScreenPlacementBadge placements={placements} full />
      <Button
        variant="ghost"
        size="sm"
        leftIcon={MonitorOff}
        onClick={remove}
      >
        {CLIENT_PLACEMENT_COPY.remove}
      </Button>
    </span>
  )
}
