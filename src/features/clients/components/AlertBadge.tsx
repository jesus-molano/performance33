import { TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui'
import { plural } from '@/lib/format'

/** Amber 'N alertas' badge for pinned private notes (hidden when there are none). */
export function AlertBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <Badge tone="private" icon={TriangleAlert}>
      {plural(count, 'alerta', 'alertas')}
    </Badge>
  )
}
