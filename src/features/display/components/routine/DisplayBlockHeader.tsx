import { BLOCK_TYPE_META } from '@/config/blockTypes'
import { cn } from '@/lib/cn'
import type { DisplayBlock } from '@/lib/display'
import { getBlockOverline, getVisibleBadge } from '@/features/display/utils/blockBadges'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DENSITY_STYLES } from './densityStyles'
import { FlashTag } from './FlashTag'

interface DisplayBlockHeaderProps {
  block: DisplayBlock
  theme: DisplayThemeClasses
  flashing: boolean
}

/** Big type header ('EMOM 12′', '3 rondas', 'Superserie × 4') with icon, badge, chip and 'Actualizado'. */
export function DisplayBlockHeader({ block, theme, flashing }: DisplayBlockHeaderProps) {
  const Icon = BLOCK_TYPE_META[block.type].icon
  const overline = getBlockOverline(block)
  const badge = getVisibleBadge(block)
  const headlineColor = block.muted ? theme.secondaryText : theme.accentText

  return (
    <header className="relative flex items-start gap-[0.6em]">
      {flashing && <FlashTag theme={theme} className={DENSITY_STYLES.comfortable.flashTag} />}
      <Icon size="1em" aria-hidden className={cn('mt-[0.15em] shrink-0 text-[1.75em]', headlineColor)} />
      <div className="min-w-0 flex-1">
        {overline && (
          <p className={cn('text-[1em] font-semibold tracking-[0.14em] uppercase', theme.subtleText)}>{overline}</p>
        )}
        <h2 className={cn('text-[1.75em] leading-tight [overflow-wrap:anywhere] font-bold tracking-wide uppercase', headlineColor)}>
          {block.headline}
        </h2>
        {block.subtitle && <p className={cn('text-[1.2em] leading-snug [overflow-wrap:anywhere]', theme.secondaryText)}>{block.subtitle}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-[0.3em]">
        {badge && (
          <span className={cn('rounded-full px-[0.6em] py-[0.1em] text-[0.95em] font-bold tracking-wider', theme.outlineBadge)}>
            {badge}
          </span>
        )}
        {block.chip && (
          <span className={cn('tabular max-w-[12em] [overflow-wrap:anywhere] rounded-[0.4em] px-[0.5em] py-[0.05em] text-[1.35em] font-bold', theme.badge)}>
            {block.chip}
          </span>
        )}
      </div>
    </header>
  )
}
