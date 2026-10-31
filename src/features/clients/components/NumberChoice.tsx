import type { ReactNode } from 'react'
import { Chip } from '@/components/ui'

export interface NumberChoiceProps {
  label: string
  hint?: ReactNode
  options: readonly number[]
  value: number
  onChange: (value: number) => void
  /** Accessible text per option, e.g. n => '3 días'. */
  optionLabel?: (value: number) => string
}

/** One-tap choice between a few numbers (training days, weeks). */
export function NumberChoice({ label, hint, options, value, onChange, optionLabel }: NumberChoiceProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-fg">{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option}
            active={option === value}
            onClick={() => onChange(option)}
            aria-label={optionLabel?.(option)}
            className="h-11 min-w-12 text-md"
          >
            {option}
          </Chip>
        ))}
      </div>
      {hint && <p className="text-sm text-fg-muted">{hint}</p>}
    </div>
  )
}
