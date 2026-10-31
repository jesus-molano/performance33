import { Lightbulb, Repeat } from 'lucide-react'
import { Button } from '../../../../components/ui'
import { shouldSuggestCircuit } from '../../../../lib/blocks'
import { useAppActions } from '../../../../store'
import type { Block } from '../../../../types'

/** A superset with 4+ exercises is usually a circuit: offer the switch (exercises are kept). */
export function SupersetHint({ block }: { block: Block }) {
  const { changeBlockType } = useAppActions()
  if (!shouldSuggestCircuit(block)) return null
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-800">
      <Lightbulb size={16} aria-hidden />
      <span className="flex-1">Con 4 o más ejercicios alternados suele ser un circuito.</span>
      <Button size="sm" variant="secondary" leftIcon={Repeat} onClick={() => changeBlockType(block.id, 'circuit')}>
        Cambiar a circuito
      </Button>
    </div>
  )
}
