import { Check } from 'lucide-react'
import { Badge } from '@/components/ui'
import type { BlockTypeMeta } from '@/config/blockTypes'
import { cn } from '@/lib/cn'

export interface BlockTypeCardProps {
  meta: BlockTypeMeta
  selected?: boolean
  onSelect: () => void
}

/** Big card in the block picker: icon + Spanish name (+ acronym) + one-line explanation. */
export function BlockTypeCard({ meta, selected = false, onSelect }: BlockTypeCardProps) {
  const Icon = meta.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative flex h-full flex-col gap-2 rounded-2xl border p-4 text-left transition-all',
        'hover:-translate-y-0.5 hover:border-brand-line hover:shadow-pop',
        selected ? 'border-brand-strong bg-brand-soft' : 'border-line bg-surface',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            meta.muted ? 'bg-fg/5 text-fg-muted' : 'bg-ink text-brand',
          )}
        >
          <Icon size={20} aria-hidden />
        </span>
        <span className="text-base font-semibold text-fg">{meta.label}</span>
        {meta.acronym && (
          <Badge tone="brand" size="sm">
            {meta.acronym}
          </Badge>
        )}
        {selected && <Check size={18} aria-label="Tipo actual" className="ml-auto text-brand-strong" />}
      </div>
      <p className="text-sm leading-snug text-fg-muted">{meta.description}</p>
    </button>
  )
}
