import { cn } from '../../../../lib/cn'

/** Position label badge: superset letters (A1) in pink, numbers/minutes neutral. */
export function RowLabel({ label }: { label: string }) {
  const isLetter = /^[A-Z]\d/.test(label)
  return (
    <span
      className={cn(
        'inline-flex h-7 min-w-8 shrink-0 items-center justify-center rounded-lg px-1.5 text-xs font-bold tabular',
        isLetter ? 'bg-brand-soft text-brand-strong' : 'bg-fg/5 text-fg-muted',
      )}
    >
      {label}
    </span>
  )
}
