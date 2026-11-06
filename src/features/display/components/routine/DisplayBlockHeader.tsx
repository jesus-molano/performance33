import { BLOCK_TYPE_META } from '@/config/blockTypes'
import { cn } from '@/lib/cn'
import type { DisplayBlock } from '@/lib/display'
import type { DisplayDensity } from '@/features/display/utils/autoFit'
import { getBandChips, getBlockOverline } from '@/features/display/utils/blockBadges'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DENSITY_STYLES } from './densityStyles'
import { DisplayBlockTile } from './DisplayBlockTile'
import { FlashTag } from './FlashTag'

interface DisplayBlockHeaderProps {
  block: DisplayBlock
  density: DisplayDensity
  theme: DisplayThemeClasses
  flashing: boolean
}

/**
 * Full-width band on top of a block: letter tile, headline ('EMOM 12′', 'Superserie × 4') and, on the right, the
 * acronym, rep scheme and rest pills (the rest never hides: the client needs it). Warm-up/mobility get a quieter band.
 * When the titles and the pills do not fit side by side the pills move below, so no word breaks. The small type icon
 * is a decoration and hides when the day needs the room.
 */
export function DisplayBlockHeader({ block, density, theme, flashing }: DisplayBlockHeaderProps) {
  const styles = DENSITY_STYLES[density]
  const Icon = BLOCK_TYPE_META[block.type].icon
  const overline = getBlockOverline(block)
  const chips = getBandChips(block)

  return (
    <header className={cn('flex flex-wrap items-center', styles.band, block.muted ? theme.mutedBlockBand : theme.blockBand)}>
      <DisplayBlockTile block={block} theme={theme} className={styles.tile} />
      <div className={cn('min-w-0 flex-[1_1_auto]', styles.titles)}>
        {overline && <p className={cn('font-semibold tracking-[0.1em] uppercase opacity-80', styles.overline)}>{overline}</p>}
        <h2 className={cn('flex items-center gap-[0.35em] font-extrabold tracking-wide uppercase', styles.headline)}>
          {block.letter && <Icon size="0.85em" aria-hidden className="shrink-0 [display:var(--display-extra,block)]" />}
          <span className="min-w-0 [overflow-wrap:anywhere]">{block.headline}</span>
        </h2>
        {block.subtitle && <p className={cn('font-medium opacity-90 [overflow-wrap:anywhere]', styles.subtitle)}>{block.subtitle}</p>}
      </div>
      {chips.length > 0 && (
        <div className="ml-auto flex flex-wrap justify-end gap-[0.3em]">
          {chips.map((chip) => (
            <span key={chip} className={cn('tabular font-bold [overflow-wrap:anywhere]', styles.chip, theme.bandChip)}>
              {chip}
            </span>
          ))}
        </div>
      )}
      {flashing && <FlashTag theme={theme} />}
    </header>
  )
}
