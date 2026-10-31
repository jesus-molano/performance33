import type { LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'
import { BUTTON_VARIANTS, type ButtonVariant } from './styles'

export type IconButtonSize = 'sm' | 'md'

const SIZES: Record<IconButtonSize, { box: string; icon: number }> = {
  sm: { box: 'size-9 rounded-lg', icon: 16 },
  md: { box: 'size-11 rounded-xl', icon: 20 },
}

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  icon: LucideIcon
  /** Required: used as aria-label and tooltip. */
  label: string
  variant?: ButtonVariant
  size?: IconButtonSize
}

export function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition-colors',
        'disabled:pointer-events-none disabled:opacity-40',
        BUTTON_VARIANTS[variant],
        SIZES[size].box,
        className,
      )}
      {...props}
    >
      <Icon size={SIZES[size].icon} aria-hidden />
    </button>
  )
}
