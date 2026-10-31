import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: ReactNode
  /** Usually a primary <Button>. */
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
        <Icon size={26} aria-hidden />
      </span>
      <div className="max-w-sm space-y-1">
        <h3 className="text-lg font-semibold text-fg">{title}</h3>
        {description && <p className="text-md text-fg-muted">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
