import { cn } from '@/lib/cn'
import { SEND_COPY } from '@/features/screens/config/copy'
import type { PickerTile } from '@/features/screens/utils/picker'

export interface ScreenSectionTileProps {
  tile: PickerTile
  screenName: string
  clientName: string
  online: boolean
  onPick: () => void
}

/** One section of a screen in the picker: who it shows (first name) or 'Libre'. One tap sends there. */
export function ScreenSectionTile({ tile, screenName, clientName, online, onPick }: ScreenSectionTileProps) {
  const where = SEND_COPY.where(screenName, tile.ref.section)
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={SEND_COPY.tileLabel(where, tile.occupant, clientName)}
      className={cn(
        'relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-2 py-2 text-center transition-colors',
        'focus-visible:ring-3 focus-visible:ring-brand-strong/30 focus-visible:outline-none',
        tile.here
          ? 'border-brand-strong bg-brand-soft'
          : tile.occupant
            ? 'border-line-strong bg-surface hover:border-brand-strong hover:bg-brand-soft/60'
            : 'border-dashed border-line-strong bg-surface/60 hover:border-brand-strong hover:bg-brand-soft/60',
        !online && 'opacity-70',
      )}
    >
      <span className="w-full truncate text-xs font-medium text-fg-muted">{SEND_COPY.section(tile.ref.section)}</span>
      <span className={cn('w-full truncate text-base font-semibold', tile.occupant ? 'text-fg' : 'text-fg-subtle')}>
        {tile.occupant ?? SEND_COPY.free}
      </span>
      {tile.here && (
        <span className="text-xs font-medium text-brand-strong">{tile.here === 'same' ? SEND_COPY.here : SEND_COPY.otherDay(tile.shownDay)}</span>
      )}
      {tile.isLast && !tile.here && (
        <span className="absolute top-1 right-1 rounded-full bg-ink px-1.5 text-[0.6875rem] font-semibold text-white">{SEND_COPY.last}</span>
      )}
    </button>
  )
}
