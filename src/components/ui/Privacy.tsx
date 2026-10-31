import { Eye, Lock } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export type PrivacyKind = 'private' | 'visible'

const LABELS: Record<PrivacyKind, string> = {
  private: 'Solo monitores',
  visible: 'Lo verá el cliente',
}

/** 'Solo monitores' (amber + lock) or 'Lo verá el cliente' (pink + eye). Put it next to every note field. */
export function PrivacyLabel({ kind, className }: { kind: PrivacyKind; className?: string }) {
  const Icon = kind === 'private' ? Lock : Eye
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[0.8125rem] font-semibold tracking-wide uppercase',
        kind === 'private' ? 'text-private' : 'text-brand-strong',
        className,
      )}
    >
      <Icon size={14} aria-hidden />
      {LABELS[kind]}
    </span>
  )
}

/** Amber container for anything private (internal notes, health alerts). */
export function PrivateSurface({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-xl border border-private-line bg-private-bg text-private', className)} {...props} />
}
