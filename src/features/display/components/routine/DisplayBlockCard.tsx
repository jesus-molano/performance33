import { cn } from '@/lib/cn'
import type { DisplayBlock } from '@/lib/display'
import { foldLines } from '@/lib/format'
import type { DisplayDensity } from '@/features/display/utils/autoFit'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DENSITY_STYLES } from './densityStyles'
import { DisplayBlockHeader } from './DisplayBlockHeader'
import { DisplayBlockNote } from './DisplayBlockNote'
import { DisplayExerciseList } from './DisplayExerciseList'

interface DisplayBlockCardProps {
  block: DisplayBlock
  density: DisplayDensity
  theme: DisplayThemeClasses
  flashing: boolean
}

/**
 * One block as a card: header band, then free text (warm-up), exercise rows and the client-visible note.
 * Compact folds the free text onto one flowing line.
 */
export function DisplayBlockCard({ block, density, theme, flashing }: DisplayBlockCardProps) {
  const styles = DENSITY_STYLES[density]
  return (
    <article
      className={cn('break-inside-avoid overflow-hidden', styles.card, block.muted ? theme.mutedCard : theme.card, flashing && 'animate-flash')}
    >
      <DisplayBlockHeader block={block} density={density} theme={theme} flashing={flashing} />
      <div className={styles.body}>
        {block.text && (
          <p className={cn('font-medium [overflow-wrap:anywhere]', styles.blockText, theme.secondaryText)}>
            {density === 'compact' ? foldLines(block.text) : block.text}
          </p>
        )}
        {block.exercises.length > 0 && <DisplayExerciseList block={block} density={density} theme={theme} />}
        {block.note && <DisplayBlockNote note={block.note} className={styles.note} theme={theme} />}
      </div>
    </article>
  )
}
