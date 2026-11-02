import { BellRing } from 'lucide-react'
import { Badge } from '@/components/ui'
import { plural } from '@/lib/format'

/** Amber '2 importantes' badge for the client's important notifications (hidden when there are none). */
export function ImportantBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <Badge tone="private" icon={BellRing}>
      {plural(count, 'importante', 'importantes')}
    </Badge>
  )
}
