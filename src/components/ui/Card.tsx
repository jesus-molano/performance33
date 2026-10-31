import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

export interface CardProps extends ComponentProps<'div'> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PADDING: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
}

/** White rounded surface with hairline border. */
export function Card({ padding = 'md', className, ...props }: CardProps) {
  return <div className={cn('rounded-2xl border border-line bg-surface shadow-card', PADDING[padding], className)} {...props} />
}
