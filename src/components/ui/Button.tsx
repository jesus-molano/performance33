import type { LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { BUTTON_SIZES, BUTTON_VARIANTS, BUTTON_WRAP_SIZES, type ButtonSize, type ButtonVariant } from './styles'

export type { ButtonSize, ButtonVariant }

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  fullWidth?: boolean
  /** Long label that may wrap on narrow screens instead of overflowing. */
  wrap?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  wrap = false,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const iconSize = size === 'sm' ? 16 : 18
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-medium transition-colors',
        wrap ? 'whitespace-normal' : 'whitespace-nowrap',
        'disabled:pointer-events-none disabled:opacity-45',
        BUTTON_VARIANTS[variant],
        wrap ? BUTTON_WRAP_SIZES[size] : BUTTON_SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {LeftIcon && <LeftIcon size={iconSize} aria-hidden />}
      {children}
      {RightIcon && <RightIcon size={iconSize} aria-hidden />}
    </button>
  )
}
