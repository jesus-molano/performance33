import { cn } from '@/lib/cn'
import type { DisplayBlock } from '@/lib/display'
import type { DisplayDensity } from '@/features/display/utils/autoFit'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DENSITY_STYLES } from './densityStyles'
import { DisplayExerciseRow } from './DisplayExerciseRow'
import { DisplayExerciseRowCompact } from './DisplayExerciseRowCompact'

interface DisplayExerciseListProps {
  block: DisplayBlock
  week: number | null
  density: DisplayDensity
  theme: DisplayThemeClasses
}

/** Exercise rows; supersets get a vertical bracket joining A1/A2. Warm-up/mobility rows are smaller. */
export function DisplayExerciseList({ block, week, density, theme }: DisplayExerciseListProps) {
  const styles = DENSITY_STYLES[density]
  const Row = density === 'compact' ? DisplayExerciseRowCompact : DisplayExerciseRow
  return (
    <ul
      className={cn(
        'divide-y',
        styles.exerciseList,
        theme.rowDivider,
        block.type === 'superset' && cn(styles.bracket, theme.accentBorder),
      )}
    >
      {block.exercises.map((line) => (
        <Row key={line.id} line={line} week={week} muted={block.muted} theme={theme} />
      ))}
    </ul>
  )
}
