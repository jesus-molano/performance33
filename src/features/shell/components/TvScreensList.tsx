import { Monitor, Plus, Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { cn } from '@/lib/cn'
import { TV_LAUNCHER } from '@/features/shell/config'
import { useTvLauncher, type TvScreenEntry } from '@/features/shell/hooks/useTvLauncher'

interface TvScreenRowProps {
  entry: TvScreenEntry
  canRemove: boolean
  onOpen: () => void
  onRemove: () => void
}

function TvScreenRow({ entry, canRemove, onOpen, onRemove }: TvScreenRowProps) {
  const label = entry.isOpen ? TV_LAUNCHER.focusLabel(entry.title) : TV_LAUNCHER.openLabel(entry.title)
  return (
    <li className="flex items-center gap-1">
      <button type="button" onClick={onOpen} aria-label={label} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-1.5 text-left hover:bg-fg/5">
        <Monitor size={18} aria-hidden className="shrink-0 text-fg-muted" />
        <span className="min-w-0 flex-1">
          <span className="block text-md font-semibold text-fg">{entry.title}</span>
          <span className="block truncate text-sm text-fg-muted">{entry.people}</span>
        </span>
        <span className={cn('shrink-0 text-sm font-medium', entry.isOpen ? 'text-emerald-700' : 'text-brand-strong')}>
          {entry.isOpen ? TV_LAUNCHER.isOpen : TV_LAUNCHER.open}
        </span>
      </button>
      {canRemove && <IconButton icon={Trash2} label={TV_LAUNCHER.removeLabel(entry.title)} onClick={onRemove} />}
    </li>
  )
}

/** Content of the 'Pantallas' menu: each screen opens or comes to the front, and 'Añadir pantalla' adds and opens the next. */
export function TvScreensList({ onDone }: { onDone: () => void }) {
  const launcher = useTvLauncher()
  const run = (action: () => void) => () => {
    onDone()
    action()
  }

  return (
    <div className="flex flex-col">
      <p className="px-3 pt-2 pb-1 text-sm text-fg-muted">{TV_LAUNCHER.hint}</p>
      <ul>
        {launcher.entries.map((entry) => (
          <TvScreenRow
            key={entry.screen}
            entry={entry}
            canRemove={launcher.canRemove}
            onOpen={run(() => launcher.open(entry.screen))}
            onRemove={run(() => launcher.remove(entry.screen))}
          />
        ))}
      </ul>
      <div className="my-1 h-px bg-line" aria-hidden />
      <button
        type="button"
        onClick={run(launcher.add)}
        disabled={!launcher.canAdd}
        className="flex h-11 items-center gap-3 rounded-lg px-3 text-left text-md font-medium text-fg hover:bg-fg/5 disabled:opacity-40"
      >
        <Plus size={18} aria-hidden className="text-fg-muted" />
        {TV_LAUNCHER.add}
      </button>
    </div>
  )
}
