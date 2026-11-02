import { TriangleAlert } from 'lucide-react'
import { Callout } from '@/components/ui'
import { CAPACITY_TEXTS } from '@/config/capacity'
import { cn } from '@/lib/cn'
import type { DayCapacity } from '@/lib/capacity'

/** Calm 'x de 16 ejercicios · y de 5 bloques', amber near the limit; a warning for a day already over it. */
export function DayCapacityIndicator({ capacity }: { capacity: DayCapacity }) {
  return (
    <div className="flex flex-col gap-2 px-2">
      <p className={cn('tabular text-sm', capacity.level === 'ok' ? 'text-fg-muted' : 'font-medium text-amber-700')}>
        {CAPACITY_TEXTS.exercises(capacity.exercises)} · {CAPACITY_TEXTS.blocks(capacity.blocks)}
      </p>
      {capacity.level === 'over' && (
        <Callout tone="warning" icon={TriangleAlert}>
          {CAPACITY_TEXTS.overLimit}
        </Callout>
      )}
    </div>
  )
}
