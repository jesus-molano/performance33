import { MonitorOff } from 'lucide-react'
import { IconButton } from '@/components/ui'
import type { Client } from '@/types'
import { CLIENT_PLACEMENT_COPY } from '@/features/clients/config'
import { useClientScreenPlacement } from '@/features/clients/hooks/useClientScreenPlacement'
import { ScreenPlacementBadge } from './ScreenPlacementBadge'

/** On the user's page: where they show on the TVs now and a round 'Quitar de la pantalla' next to it (nothing when on none). */
export function ClientScreenPlacement({ client }: { client: Pick<Client, 'id' | 'firstName' | 'archived'> }) {
  const { placements, remove } = useClientScreenPlacement(client)
  if (!placements.length) return null
  return (
    // Never squeezed (the plan pill beside it gives way); a long screen name is cut inside, leaving the plan 3.5rem.
    <span className="inline-flex max-w-[calc(100%-3.5rem)] min-w-0 shrink-0 items-center gap-1.5">
      <ScreenPlacementBadge placements={placements} full size="sm" />
      <IconButton icon={MonitorOff} label={CLIENT_PLACEMENT_COPY.remove} variant="secondary" size="xs" onClick={remove} />
    </span>
  )
}
