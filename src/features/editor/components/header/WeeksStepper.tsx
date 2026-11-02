import { Minus, Plus } from 'lucide-react'
import { useId } from 'react'
import { IconButton } from '@/components/ui'
import { MAX_PROGRAM_WEEKS } from '@/config/app'
import { useValueDraft } from '@/hooks'
import { cn } from '@/lib/cn'
import { parseOptionalInt } from '@/lib/numbers'
import { DATE_ROW_CLASSES } from '@/features/editor/config'

export interface WeeksStepperProps {
  value: number
  onChange: (weeks: number) => void
}

/** Valid week count, or undefined while the field is empty / 0 (the coach is retyping). */
const parseWeeks = (text: string): number | undefined => {
  const weeks = parseOptionalInt(text)
  return weeks ? Math.min(weeks, MAX_PROGRAM_WEEKS) : undefined
}

/** − 4 +. Big buttons so it works with a thumb; the number can be retyped freely. */
export function WeeksStepper({ value, onChange }: WeeksStepperProps) {
  const id = useId()
  const draft = useValueDraft({ value, format: String, parse: parseWeeks, onCommit: onChange })
  return (
    <div className={cn('flex flex-col gap-1.5', DATE_ROW_CLASSES)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        Semanas
      </label>
      <div className="flex h-11 items-center rounded-xl border border-line-strong bg-surface">
        <IconButton icon={Minus} label="Una semana menos" disabled={value <= 1} onClick={() => onChange(value - 1)} />
        <input
          id={id}
          inputMode="numeric"
          value={draft.text}
          onChange={(e) => draft.onChange(e.target.value)}
          onBlur={draft.onBlur}
          className="h-full w-10 min-w-0 flex-1 bg-transparent text-center text-base font-semibold tabular focus:outline-none"
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
