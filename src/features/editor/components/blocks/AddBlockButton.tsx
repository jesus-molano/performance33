import { LayoutGrid, Plus } from 'lucide-react'

/** Large dashed '+ Añadir bloque' at the end of the day. */
export function AddBlockButton({ onClick, isFirst }: { onClick: () => void; isFirst: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-20 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line-strong bg-surface/50 px-4 text-left transition-colors hover:border-brand-strong hover:bg-brand-soft"
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
