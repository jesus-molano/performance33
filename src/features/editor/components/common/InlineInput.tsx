import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { breakUndoGroup } from '@/store'

const SIZES = {
  xl: 'h-12 text-2xl font-semibold tracking-tight md:text-[28px]',
  lg: 'h-11 text-lg font-semibold',
  md: 'h-11 text-base font-semibold',
} as const

export interface InlineInputProps extends Omit<ComponentProps<'input'>, 'size' | 'onChange'> {
  /** Required: these inputs have no visible label. */
  'aria-label': string
  onValueChange: (value: string) => void
  size?: keyof typeof SIZES
}

/** Title-like store-bound input: looks like text, shows a field on hover/focus. Blur ends the undo group. */
export function InlineInput({ onValueChange, size = 'md', className, onBlur, ...props }: InlineInputProps) {
  return (
    <input
      {...props}
      onChange={(e) => onValueChange(e.target.value)}
      onBlur={(e) => {
        breakUndoGroup()
        onBlur?.(e)
      }}
      className={cn(
        'w-full min-w-0 rounded-lg border border-transparent bg-transparent px-2 text-fg transition-colors',
        'placeholder:text-fg-subtle hover:border-line focus:border-brand-strong focus:bg-surface',
        // Touch screens have no hover: keep a faint border so the text reads as editable.
        '[@media(hover:none)]:border-line',
        'focus:ring-3 focus:ring-brand-strong/15 focus:outline-none',
        SIZES[size],
        className,
      )}
    />
  )
}
