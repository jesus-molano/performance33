import { cn } from '@/lib/cn'
import { isWideScreen, REMOTE_COPY, type RemoteScreen, type RemoteTile } from '@/features/screens'
import { TvSectionStepper } from '@/features/shell/components/TvSectionStepper'
import { RemoteSectionTile } from './RemoteSectionTile'

export interface RemoteScreenCardProps {
  screen: RemoteScreen
  onPick: (tile: RemoteTile) => void
  onSections: (sections: number) => void
}

function WindowState({ online }: { online: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', online ? 'text-emerald-700' : 'text-fg-muted')}>
      <span className={cn('size-2 shrink-0 rounded-full', online ? 'bg-emerald-500' : 'bg-fg-subtle')} aria-hidden />
      {online ? REMOTE_COPY.online : REMOTE_COPY.offline}
    </span>
  )
}

/** A gym screen on the phone: whether its window is open on the laptop, its sections ('− 3 +') and who each one shows, in the TV's grid. */
export function RemoteScreenCard({ screen, onPick, onSections }: RemoteScreenCardProps) {
  const narrow = isWideScreen(screen)
  return (
    <section aria-label={screen.name} className={cn('flex flex-col gap-2.5 rounded-2xl border border-line p-3', screen.online ? 'bg-canvas' : 'bg-fg/5')}>
      <header className="flex min-h-11 items-center gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-md font-semibold text-fg">{screen.name}</h3>
          <WindowState online={screen.online} />
        </div>
        <TvSectionStepper title={screen.name} value={screen.sections} onChange={onSections} size="touch" />
      </header>
      <div
        className="grid gap-1.5 rounded-xl bg-ink/10 p-1.5"
        style={{ gridTemplateColumns: `repeat(${screen.columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${screen.rows}, minmax(0, 1fr))` }}
      >
        {screen.tiles.map((tile) => (
          <RemoteSectionTile key={tile.ref.section} tile={tile} narrow={narrow} onPick={() => onPick(tile)} />
        ))}
      </div>
    </section>
  )
}
