import { Lightbulb, Repeat } from 'lucide-react'
import { Button, Callout } from '@/components/ui'
import { shouldSuggestCircuit } from '@/lib/blocks'
import type { Block } from '@/types'

export interface SupersetHintProps {
  block: Block
  onSwitchToCircuit: () => void
}

/** A superset with 4+ exercises is usually a circuit: offer the switch (exercises are kept). */
export function SupersetHint({ block, onSwitchToCircuit }: SupersetHintProps) {
  if (!shouldSuggestCircuit(block)) return null
  return (
    <Callout icon={Lightbulb}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1">Con 4 o más ejercicios alternados suele ser un circuito.</span>
        <Button size="sm" variant="secondary" leftIcon={Repeat} onClick={onSwitchToCircuit}>
          Cambiar a circuito
        </Button>
      </div>
    </Callout>
  )
}
