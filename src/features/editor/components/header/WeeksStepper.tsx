import { Minus, Plus } from 'lucide-react'
import { useId } from 'react'
import { IconButton } from '../../../../components/ui'
import { MAX_PROGRAM_WEEKS } from '../../../../config/app'
import { parseOptionalInt } from '../../../../lib/numbers'

export interface WeeksStepperProps {
  value: number
  onChange: (weeks: number) => void
}

/** − [4] + semanas. Big buttons so it works with a thumb. */
export function WeeksStepper({ value, onChange }: WeeksStepperProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        Semanas
      </label>
      <div className="flex h-11 items-center rounded-xl border border-line-strong bg-surface">
        <IconButton icon={Minus} label="Una semana menos" disabled={value <= 1} onClick={() => onChange(value - 1)} />
        <input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const weeks = parseOptionalInt(e.target.value)
            if (weeks) onChange(weeks)
          }}
          className="h-full w-10 min-w-0 bg-transparent text-center text-[15px] font-semibold tabular focus:outline-none"
        />
        <IconButton
          icon={Plus}
          label="Una semana más"
          disabled={value >= MAX_PROGRAM_WEEKS}
          onClick={() => onChange(value + 1)}
        />
      </div>
    </div>
  )
}
