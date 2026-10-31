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
  week: number | null
  density: DisplayDensity
  theme: DisplayThemeClasses
  flashing: boolean
}

/**
 * One block: type header, free text (warm-up), exercise rows, client-visible note and footer.
 * Compact: one-line header (it carries the footer) and the free text folded onto one flowing line.
 */
export function DisplayBlockCard({ block, week, density, theme, flashing }: DisplayBlockCardProps) {
  const compact = density === 'compact'
  const styles = DENSITY_STYLES[density]
  const Header = compact ? DisplayBlockHeaderCompact : DisplayBlockHeader
  return (
    <article
      className={cn('break-inside-avoid', styles.card, block.muted ? theme.mutedCard : theme.card, flashing && 'animate-flash')}
    >
      <Header block={block} theme={theme} flashing={flashing} />
      {block.text && (
        <p className={cn('[overflow-wrap:anywhere]', styles.blockText, theme.secondaryText)}>
          {compact ? foldLines(block.text) : block.text}
        </p>
      )}
      {block.exercises.length > 0 && <DisplayExerciseList block={block} week={week} density={density} theme={theme} />}
      {block.note && <DisplayBlockNote note={block.note} className={styles.note} theme={theme} />}
      {block.footer && !compact && (
        <p className={cn('mt-[0.5em] flex items-center gap-[0.45em] text-[1.25em] font-medium', theme.subtleText)}>
          <Repeat size="1em" aria-hidden className="shrink-0" />
          {block.footer}
        </p>
      )}
    </article>
  )
}
