import { Eraser, UsersRound, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FILL_COPY, useClearScreens, useScreensEmpty } from '@/features/screens'
import { useFillFromClass } from '@/features/classes/hooks/useFillFromClass'

export interface ScreensFillActionsProps {
  /** After either one runs (closes the menu it is in). */
  onDone?: () => void
  className?: string
}

const ROW = 'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-md font-medium text-fg hover:bg-fg/5 disabled:opacity-50 disabled:hover:bg-transparent'

function ActionRow({ icon: Icon, label, hint, disabled, onClick }: { icon: LucideIcon; label: string; hint?: string | null; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={ROW}>
      <Icon size={18} aria-hidden className="shrink-0 text-fg-muted" />
      <span className="flex min-w-0 flex-col">
        <span>{label}</span>
        {hint && <span className="text-sm font-normal text-fg-muted">{hint}</span>}
      </span>
    </button>
  )
}

/** "Rellenar con la clase de 18:00" and "Vaciar pantallas" (Pantallas menu on the laptop, remote on the phone). */
export function ScreensFillActions({ onDone, className }: ScreensFillActionsProps) {
  const fill = useFillFromClass()
  const clearAll = useClearScreens()
  const empty = useScreensEmpty()
  const after = (action: () => void) => () => {
    action()
    onDone?.()
  }
  return (
    <div className={cn('flex flex-col', className)}>
      <ActionRow icon={UsersRound} label={fill.label} hint={fill.hint} disabled={fill.disabled} onClick={after(fill.run)} />
      <ActionRow icon={Eraser} label={FILL_COPY.clear} hint={empty ? FILL_COPY.clearHint : null} disabled={empty} onClick={after(clearAll)} />
    </div>
  )
}
