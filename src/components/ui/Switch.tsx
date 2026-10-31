import { useId, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
  className?: string
}

/** On/off toggle with a visible label (per side, fijar como alerta…). */
export function Switch({ checked, onChange, label, description, disabled, className }: SwitchProps) {
  const id = useId()
  return (
    <div className={cn('flex min-h-11 items-center justify-between gap-3', className)}>
      <label htmlFor={id} className="flex flex-col">
        <span className="text-[15px] font-medium text-fg">{label}</span>
        {description && <span className="text-sm text-fg-muted">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-45',
          checked ? 'bg-brand-strong' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'inline-block size-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}
