import { BLOCK_TYPE_META } from '@/config/blockTypes'
import { cn } from '@/lib/cn'
import type { DisplayBlock } from '@/lib/display'
import { joinParts } from '@/lib/format'
import { getBlockOverline, getVisibleBadge } from '@/features/display/utils/blockBadges'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DENSITY_STYLES } from './densityStyles'
import { FlashTag } from './FlashTag'

interface DisplayBlockHeaderCompactProps {
  block: DisplayBlock
  theme: DisplayThemeClasses
  flashing: boolean
}

/**
 * One-line block header for narrow slots: icon, title + headline, chip/badge and a muted summary
 * (subtitle, rest between rounds). Nothing goes below 1em: at 4 columns that is the readable floor.
 */
export function DisplayBlockHeaderCompact({ block, theme, flashing }: DisplayBlockHeaderCompactProps) {
  const Icon = BLOCK_TYPE_META[block.type].icon
  const overline = getBlockOverline(block)
  const badge = getVisibleBadge(block)
  const summary = joinParts([block.subtitle, block.footer])
  const headlineColor = block.muted ? theme.secondaryText : theme.accentText

  return (
    <header className="flex flex-wrap items-baseline gap-x-[0.45em] gap-y-[0.1em]">
      <Icon size="1em" aria-hidden className={cn('shrink-0 self-center text-[1.3em]', headlineColor)} />
      {overline && (
        <span className={cn('text-[1em] font-semibold tracking-[0.1em] uppercase', theme.subtleText)}>{overline}</span>
      )}
      <h2 className={cn('text-[1.3em] leading-tight font-bold tracking-wide uppercase [overflow-wrap:anywhere]', headlineColor)}>
        {block.headline}
      </h2>
      {block.chip && (
        <span className={cn('tabular rounded-[0.35em] px-[0.4em] text-[1.15em] font-bold', theme.badge)}>{block.chip}</span>
      )}
      {badge && (
        <span className={cn('rounded-full px-[0.5em] text-[1em] font-bold tracking-wider', theme.outlineBadge)}>{badge}</span>
      )}
      {summary && <span className={cn('text-[1.15em] leading-snug', theme.subtleText)}>{summary}</span>}
      {flashing && <FlashTag theme={theme} className={DENSITY_STYLES.compact.flashTag} />}
    </header>
  )
}
