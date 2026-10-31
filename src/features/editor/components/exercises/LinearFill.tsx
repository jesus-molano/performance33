import { Plus, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { formatNumber, parseNumber } from '@/lib/numbers'
import type { ProgressionTarget } from '@/types'
import { PROGRESSION_STEP_DEFAULTS } from '@/features/editor/config'

export interface LinearFillProps {
  target: ProgressionTarget
  onFill: (step: number) => void
}

/** 'Rellenar: +2,5 por semana' helper that pre-fills every week from the base value. */
export function LinearFill({ target, onFill }: LinearFillProps) {
  const [step, setStep] = useState(() => formatNumber(PROGRESSION_STEP_DEFAULTS[target]))
  const value = parseNumber(step)
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Input
        nativeUndo
        label="Aumentar cada semana"
        inputMode="decimal"
        value={step}
        onChange={(e) => setStep(e.target.value)}
        containerClassName="w-40"
        className="tabular"
        leftIcon={Plus}
      />
      <Button variant="secondary" leftIcon={Wand2} disabled={value === null} onClick={() => value !== null && onFill(value)}>
        Rellenar semanas
      </Button>
    </div>
  )
}
