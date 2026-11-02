import { LayoutGrid, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface AddBlockButtonProps {
  onClick: () => void
  isFirst: boolean
  /** Why the day takes no more blocks, or null. */
  disabledReason: string | null
}

/** Large dashed '+ Añadir bloque' at the end of the day, replaced by the explanation when the day is full. On phones, once there are blocks, the sticky bar does this. */
export function AddBlockButton({ onClick, isFirst, disabledReason }: AddBlockButtonProps) {
  if (disabledReason) {
    return <p className="flex min-h-14 items-center justify-center rounded-2xl bg-fg/5 px-4 text-center text-sm text-fg-muted">{disabledReason}</p>
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(!isFirst && 'hidden md:flex', isFirst && 'flex', 'group min-h-20 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line-strong bg-surface/50 px-4 text-left transition-colors hover:border-brand-strong hover:bg-brand-soft')}
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-ink text-brand transition-transform group-hover:scale-105">
        <Plus size={20} aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="text-base font-semibold text-fg">{isFirst ? 'Añade el primer bloque' : 'Añadir bloque'}</span>
        <span className="flex items-center gap-1 text-sm text-fg-muted">
          <LayoutGrid size={14} aria-hidden />
          Normal, superserie, circuito, EMOM, AMRAP…
        </span>
      </span>
    </button>
  )
}
