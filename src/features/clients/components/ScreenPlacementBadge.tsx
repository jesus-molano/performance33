import { Monitor } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/cn'
import { CLIENT_PLACEMENT_COPY } from '@/features/clients/config'
import { morePlacements, placementLabel, placementShort, placementSpot, placementsLabel, type ClientPlacement } from '@/features/clients/utils/screenPlacements'

export interface ScreenPlacementBadgeProps {
  placements: readonly ClientPlacement[]
  /**
   * The place on every width: on phones the screen's name (cut with '…' if long) plus 'S2 · Día 3' kept whole, so
   * the day on the TV always shows; from sm the whole label. Otherwise just the screen's name on phones.
   */
  full?: boolean
  size?: BadgeProps['size']
  className?: string
}

/** 'Pantalla 1 · Sección 2 · Día 3' when the user shows on a screen now (hidden when not). The full place is in its title. */
export function ScreenPlacementBadge({ placements, full = false, size, className }: ScreenPlacementBadgeProps) {
  const [first] = placements
  if (!first) return null
  const label = CLIENT_PLACEMENT_COPY.label(placementsLabel(placements))
  const more = morePlacements(placements)
  return (
    <span title={label} className={cn('inline-flex min-w-0', className)}>
      <Badge tone="info" icon={Monitor} size={size} className="max-w-full min-w-0">
        <span className="sr-only">{label}</span>
        <span aria-hidden className={cn('min-w-0 truncate sm:hidden', !full && 'max-w-32')}>
          {placementShort(first)}
        </span>
        {full && (
          <span aria-hidden className="shrink-0 tabular sm:hidden">
            · {placementSpot(first)}
          </span>
        )}
        <span aria-hidden className={full ? 'hidden min-w-0 truncate tabular sm:inline' : 'hidden tabular sm:inline'}>
          {placementLabel(first)}
        </span>
        {more && <span aria-hidden className="shrink-0 tabular">{more}</span>}
      </Badge>
    </span>
  )
}
