import { cn } from '../../../lib/cn'
import type { ProgramStatus, StatusTone } from '../../../lib/program'
import { elapsedWeeks } from '../utils/programSummary'

const BAR_TONES: Record<StatusTone, string> = {
  neutral: 'bg-fg-subtle',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
}

/** One segment per week of the block; segments up to the current week are filled. */
export function ProgramProgressBar({ status, className }: { status: ProgramStatus; className?: string }) {
  if (!status.info) return null
  const { totalWeeks } = status.info
  const filled = elapsedWeeks(status.info)
  return (
    <div
      role="progressbar"
      aria-label="Progreso del bloque"
      aria-valuemin={0}
      aria-valuemax={totalWeeks}
      aria-valuenow={filled}
      className={cn('flex gap-1', className)}
    >
      {Array.from({ length: totalWeeks }, (_, i) => (
        <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < filled ? BAR_TONES[status.tone] : 'bg-fg/10')} />
      ))}
    </div>
  )
}
