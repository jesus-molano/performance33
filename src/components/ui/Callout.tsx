import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type CalloutTone = 'info' | 'warning'

const TONES: Record<CalloutTone, string> = {
  info: 'bg-sky-50 text-sky-900',
  warning: 'border border-private-line bg-private-bg text-private',
}

export interface CalloutProps {
  tone?: CalloutTone
  icon?: LucideIcon
  children: ReactNode
  className?: string
}

/** Inline hint box (suggestions, warnings). Private health alerts use PrivateSurface instead. */
export function Callout({ tone = 'info', icon: Icon, children, className }: CalloutProps) {
  return (
    <div role={tone === 'warning' ? 'status' : undefined} className={cn('flex items-start gap-2 rounded-xl px-3 py-2 text-sm', TONES[tone], className)}>
      {Icon && <Icon size={16} aria-hidden className="mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
