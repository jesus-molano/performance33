import { Repeat } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { DisplayBlock } from '@/lib/display'
import { foldLines } from '@/lib/format'
import type { DisplayDensity } from '@/features/display/utils/autoFit'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DENSITY_STYLES } from './densityStyles'
import { DisplayBlockHeader } from './DisplayBlockHeader'
import { DisplayBlockHeaderCompact } from './DisplayBlockHeaderCompact'
import { DisplayBlockNote } from './DisplayBlockNote'
import { DisplayExerciseList } from './DisplayExerciseList'

interface DisplayBlockCardProps {
  block: DisplayBlock
  /** Position in the day, shown big when the screen is split. */
  number: number
  density: DisplayDensity
  theme: DisplayThemeClasses
  flashing: boolean
}

/**
 * One block: type header, free text (warm-up), exercise rows, client-visible note and footer.
 * Compact: one-line header (it carries the footer) and the free text folded onto one flowing line.
 */
export function DisplayBlockCard({ block, number, density, theme, flashing }: DisplayBlockCardProps) {
  const compact = density === 'compact'
  const styles = DENSITY_STYLES[density]
  return (
    <article
      className={cn('break-inside-avoid', styles.card, block.muted ? theme.mutedCard : theme.card, flashing && 'animate-flash')}
    >
      {compact ? (
        <DisplayBlockHeaderCompact block={block} theme={theme} flashing={flashing} />
      ) : (
        <DisplayBlockHeader block={block} number={number} theme={theme} flashing={flashing} />
      )}
      {block.text && (
        <p className={cn('font-medium [overflow-wrap:anywhere]', styles.blockText, theme.secondaryText)}>
          {compact ? foldLines(block.text) : block.text}
        </p>
      )}
      {block.exercises.length > 0 && <DisplayExerciseList block={block} density={density} theme={theme} />}
      {block.note && <DisplayBlockNote note={block.note} className={styles.note} theme={theme} />}
      {block.footer && !compact && (
        <p className={cn('mt-[0.4em] flex items-center gap-[0.45em] text-[1.35em] font-semibold', theme.subtleText)}>
          <Repeat size="1em" aria-hidden className="shrink-0" />
          {block.footer}
        </p>
      )}
    </article>
  )
}
