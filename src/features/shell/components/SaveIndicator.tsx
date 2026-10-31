import { cn } from '@/lib/cn'
import { useSaveStatus } from '@/store'
import { SAVE_STATUS_META } from '@/features/shell/config'

/** 'Guardando… / Guardado' pill. Changes save automatically, there is no Save button. */
export function SaveIndicator() {
  const { status } = useSaveStatus()
  const { label, icon: Icon, tone, spin } = SAVE_STATUS_META[status]
  return (
    <span
      role="status"
      aria-live="polite"
      title={label}
      className={cn('inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium', tone)}
    >
      <Icon size={17} aria-hidden className={cn(spin && 'animate-spin')} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  )
}
