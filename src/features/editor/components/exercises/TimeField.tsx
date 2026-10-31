import { useId, useState, type KeyboardEvent, type RefObject } from 'react'
import { controlClasses } from '../../../../components/ui'
import { cn } from '../../../../lib/cn'
import { inputToSeconds, preferredTimeUnit, secondsToInput, type TimeUnit } from '../../utils'

const UNITS: Array<{ value: TimeUnit; label: string }> = [
  { value: 'sec', label: 's' },
  { value: 'min', label: 'min' },
]

export interface TimeFieldProps {
  seconds: number | null
  onChange: (seconds: number | null) => void
  ref: RefObject<HTMLInputElement | null>
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onBlur: () => void
  className?: string
}

/** Duration typed in seconds or minutes (the store always keeps seconds). */
export function TimeField({ seconds, onChange, ref, onKeyDown, onBlur, className }: TimeFieldProps) {
  const id = useId()
  const [unit, setUnit] = useState<TimeUnit>(() => preferredTimeUnit(seconds))
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        Tiempo
      </label>
      <div className="flex h-11 items-stretch gap-1">
        <input
          ref={ref}
          id={id}
          inputMode="decimal"
          value={secondsToInput(seconds, unit)}
          placeholder={unit === 'sec' ? '30' : '1'}
          onChange={(e) => onChange(inputToSeconds(e.target.value, unit))}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          className={controlClasses(false, cn('min-w-0 flex-1', className))}
        />
        <div role="radiogroup" aria-label="Unidad de tiempo" className="flex rounded-xl bg-fg/5 p-0.5">
          {UNITS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={unit === option.value}
              onClick={() => setUnit(option.value)}
              className={cn(
                'rounded-lg px-2 text-sm font-medium',
                unit === option.value ? 'bg-surface text-fg shadow-card' : 'text-fg-muted',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
