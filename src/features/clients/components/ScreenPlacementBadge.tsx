import { Monitor } from 'lucide-react'
import { Badge } from '@/components/ui'
import { CLIENT_PLACEMENT_COPY } from '@/features/clients/config'
import { morePlacements, placementLabel, placementShort, placementsLabel, type ClientPlacement } from '@/features/clients/utils/screenPlacements'

export interface ScreenPlacementBadgeProps {
  placements: readonly ClientPlacement[]
  /** The whole place on every width (otherwise just the screen's name on phones). */
  full?: boolean
}

/** 'Pantalla 1 · Sección 2 · Día 3' when the user shows on a screen now (hidden when not). The full place is in its title. */
export function ScreenPlacementBadge({ placements, full = false }: ScreenPlacementBadgeProps) {
  const [first] = placements
  if (!first) return null
  const label = CLIENT_PLACEMENT_COPY.label(placementsLabel(placements))
  const more = morePlacements(placements)
  return (
    <span title={label} className="inline-flex min-w-0">
      <Badge tone="info" icon={Monitor}>
        <span className="sr-only">{label}</span>
        {!full && (
          <span aria-hidden className="max-w-32 truncate sm:hidden">
            {placementShort(first)}
          </span>
        )}
        <span aria-hidden className={full ? 'tabular' : 'hidden tabular sm:inline'}>
          {placementLabel(first)}
        </span>
        {more && <span aria-hidden className="tabular">{more}</span>}
      </Badge>
    </span>
  )
}
