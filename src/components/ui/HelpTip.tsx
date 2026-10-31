import { CircleHelp } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface HelpTipProps {
  /** Plain-Spanish explanation of a term (EMOM, RPE, tempo…). */
  text: string
  className?: string
}

/** Small '?' that explains jargon on hover/focus/tap (native tooltip + accessible label). */
export function HelpTip({ text, className }: HelpTipProps) {
  return (
    <span
      tabIndex={0}
      role="img"
      aria-label={text}
      title={text}
      className={cn('inline-flex cursor-help items-center text-fg-subtle hover:text-fg-muted', className)}
    >
      <CircleHelp size={15} aria-hidden />
    </span>
  )
}
