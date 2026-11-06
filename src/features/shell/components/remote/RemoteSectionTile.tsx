import { cn } from '@/lib/cn'
import { REMOTE_COPY, SEND_COPY, type RemoteTile } from '@/features/screens'

export interface RemoteSectionTileProps {
  tile: RemoteTile
  /** Many sections side by side: the number alone, and the day without its name. */
  narrow: boolean
  onPick: () => void
}

/** One section of a gym screen on the phone: who it shows and which day, or 'Libre'. A tap opens what can be done. */
export function RemoteSectionTile({ tile, narrow, onPick }: RemoteSectionTileProps) {
  const { person } = tile
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={REMOTE_COPY.tileLabel(tile.where, person?.fullName ?? null, tile.dayLabel)}
      className={cn(
        'flex min-h-20 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1.5 py-2 text-center transition-colors',
        'focus-visible:ring-3 focus-visible:ring-brand-strong/30 focus-visible:outline-none active:bg-brand-soft/60',
        person ? 'border-line-strong bg-surface' : 'border-dashed border-line-strong bg-surface/60',
      )}
    >
      <span className="w-full truncate text-xs font-medium text-fg-muted">
        {narrow ? SEND_COPY.sectionShort(tile.ref.section) : SEND_COPY.section(tile.ref.section)}
      </span>
      <span className={cn('w-full truncate text-base font-semibold', person ? 'text-fg' : 'text-fg-subtle')}>{person?.firstName ?? REMOTE_COPY.free}</span>
      {person && <span className="w-full truncate text-xs text-fg-muted">{narrow ? REMOTE_COPY.day(tile.day) : tile.dayLabel}</span>}
    </button>
  )
}
