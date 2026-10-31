import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentOption<T>>
  value: T
  onChange: (value: T) => void
  /** Accessible group name, e.g. 'Tipo de medida'. */
  ariaLabel: string
  size?: 'sm' | 'md'
  fullWidth?: boolean
  className?: string
}

/** Pill toggle group (Reps | Tiempo | Distancia | Calorías, Oscuro | Claro…). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  fullWidth = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex rounded-xl bg-fg/5 p-1', fullWidth && 'flex w-full', className)}
    >
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const selected = optionValue === value
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(optionValue)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-all',
              size === 'sm' ? 'h-10 px-2.5 text-sm md:h-8' : 'h-10 px-3.5 text-md',
              selected ? 'bg-surface text-fg shadow-card' : 'text-fg-muted hover:text-fg',
            )}
          >
            {Icon && <Icon size={16} aria-hidden />}
            {label}
          </button>
        )
      })}
    </div>
  )
}
