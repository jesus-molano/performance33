import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { StatusTone } from '@/lib/program'

export type BadgeTone = StatusTone | 'brand' | 'private'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-fg/5 text-fg-muted ring-fg/10',
  brand: 'bg-brand-soft text-brand-strong ring-brand-line',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  private: 'bg-private-bg text-private ring-private-line',
}

export interface BadgeProps {
  tone?: BadgeTone
  icon?: LucideIcon
  size?: 'sm' | 'md'
  className?: string
  children: ReactNode
}

/** Status pill. Tones match getProgramStatus().tone, plus brand and private (amber). */
export function Badge({ tone = 'neutral', icon: Icon, size = 'md', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-[13px]',
        TONES[tone],
        className,
      )}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 14} aria-hidden className="shrink-0" />}
      {children}
    </span>
  )
}
