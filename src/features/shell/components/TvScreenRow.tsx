import { Monitor, Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { cn } from '@/lib/cn'
import { TV_LAUNCHER } from '@/features/shell/config'
import type { TvScreenEntry } from '@/features/shell/hooks/useTvLauncher'
import { TvSectionStepper } from './TvSectionStepper'

export interface TvScreenRowProps {
  entry: TvScreenEntry
  canRemove: boolean
  onOpen: () => void
  onRemove: () => void
  onSections: (sections: number) => void
}

/** One screen in the 'Pantallas' menu: who it shows, whether it is open and where, its sections and 'Abrir'. */
export function TvScreenRow({ entry, canRemove, onOpen, onRemove, onSections }: TvScreenRowProps) {
  const { placement } = entry
  return (
    <li className="flex flex-col pb-1">
      <div className="flex items-center gap-1">
        <button type="button" onClick={onOpen} aria-label={placement.openLabel} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-1 text-left hover:bg-fg/5">
          <Monitor size={18} aria-hidden className="shrink-0 text-fg-muted" />
          <span className="min-w-0 flex-1">
            <span className="block text-md font-semibold text-fg">{entry.title}</span>
            <span className="block truncate text-sm text-fg-muted">{entry.people}</span>
          </span>
          <span className="shrink-0 text-sm font-medium text-brand-strong">{entry.action}</span>
        </button>
        {canRemove && <IconButton icon={Trash2} label={TV_LAUNCHER.removeLabel(entry.title)} onClick={onRemove} />}
      </div>
      <div className="flex items-center justify-between gap-2 pr-3 pl-10">
        <span className={cn('min-w-0 truncate text-sm', placement.disconnected ? 'font-medium text-red-700' : entry.isOpen ? 'text-emerald-700' : 'text-fg-subtle')}>
          {entry.status}
        </span>
        <TvSectionStepper title={entry.title} value={entry.sections} onChange={onSections} />
      </div>
    </li>
  )
}
