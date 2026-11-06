import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { SEND_COPY } from '@/features/screens/config/copy'
import type { SectionRef } from '@/features/screens/types'
import type { PickerScreen } from '@/features/screens/utils/picker'
import { ScreenSectionTile } from './ScreenSectionTile'

export interface ScreenPickerCardProps {
  screen: PickerScreen
  clientName: string
  /** False on phones: a TV window only opens from the computer the TV is connected to. */
  canOpen: boolean
  onPick: (ref: SectionRef) => void
  onOpen: () => void
}

function ScreenState({ online }: { online: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', online ? 'text-emerald-700' : 'text-fg-muted')}>
      <span className={cn('size-2 rounded-full', online ? 'bg-emerald-500' : 'bg-fg-subtle')} aria-hidden />
      {online ? SEND_COPY.online : SEND_COPY.offline}
    </span>
  )
}

/** A TV with its sections drawn in the layout the TV uses (1-3 side by side, 4 in 2 × 2, 5-6 in 3 × 2). */
export function ScreenPickerCard({ screen, clientName, canOpen, onPick, onOpen }: ScreenPickerCardProps) {
  return (
    <section
      aria-label={screen.name}
      className={cn('flex flex-col gap-2.5 rounded-2xl border p-3', screen.online ? 'border-line bg-canvas' : 'border-line bg-fg/5')}
    >
      <header className="flex min-h-11 items-center gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-md font-semibold text-fg">{screen.name}</h3>
          <ScreenState online={screen.online} />
        </div>
        {!screen.online && canOpen && (
          <Button size="sm" variant="secondary" leftIcon={ExternalLink} onClick={onOpen} aria-label={SEND_COPY.openLabel(screen.name)}>
            {SEND_COPY.open}
          </Button>
        )}
      </header>
      <div
        className="grid aspect-video gap-1.5 rounded-xl bg-ink/10 p-1.5"
        style={{
          gridTemplateColumns: `repeat(${screen.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${screen.rows}, minmax(0, 1fr))`,
        }}
      >
        {screen.tiles.map((tile) => (
          <ScreenSectionTile
            key={tile.ref.section}
            tile={tile}
            screenName={screen.name}
            clientName={clientName}
            online={screen.online}
            onPick={() => onPick(tile.ref)}
          />
        ))}
      </div>
      {!screen.online && <p className="text-sm text-fg-muted">{SEND_COPY.offlineNote}</p>}
    </section>
  )
}
