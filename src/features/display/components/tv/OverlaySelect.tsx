import { ChevronDown } from 'lucide-react'
import { cn } from '../../../../lib/cn'

export interface OverlaySelectOption {
  value: string
  label: string
}

interface OverlaySelectProps {
  label: string
  value: string
  options: OverlaySelectOption[]
  onChange: (value: string) => void
  className?: string
}

/** Native select (best on TVs, remotes and touch) styled for the dark/light overlays. */
export function OverlaySelect({ label, value, options, onChange, className }: OverlaySelectProps) {
  return (
    <label className={cn('relative block min-w-0', className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none truncate rounded-full border border-current/20 bg-transparent pr-9 pl-4 text-base font-semibold [&>option]:bg-ink [&>option]:text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={18} aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 opacity-70" />
    </label>
  )
}
