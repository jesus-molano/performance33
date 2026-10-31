import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

export interface ChipProps extends ComponentProps<'button'> {
  active?: boolean
}

/** One-tap quick value (reps 5/8/10/12/15, rest 30s/60s/90s/2 min, presets). */
export function Chip({ active = false, className, type = 'button', ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 min-w-11 items-center justify-center rounded-full border px-3 text-sm font-medium tabular transition-colors',
        active
          ? 'border-brand-strong bg-brand-soft text-brand-strong'
          : 'border-line-strong bg-surface text-fg-muted hover:border-fg-subtle hover:text-fg',
        className,
      )}
      {...props}
    />
  )
}
