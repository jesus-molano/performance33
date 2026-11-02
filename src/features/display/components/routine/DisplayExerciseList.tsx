import { cn } from '@/lib/cn'
import type { DisplayBlock } from '@/lib/display'
import type { DisplayDensity } from '@/features/display/utils/autoFit'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DENSITY_STYLES } from './densityStyles'
import { DisplayExerciseRow } from './DisplayExerciseRow'

interface DisplayExerciseListProps {
  block: DisplayBlock
  density: DisplayDensity
  theme: DisplayThemeClasses
}

/** Exercise rows; supersets get a vertical bracket joining A1/A2. */
export function DisplayExerciseList({ block, density, theme }: DisplayExerciseListProps) {
  const styles = DENSITY_STYLES[density]
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
        <DisplayExerciseRow key={line.id} line={line} density={density} muted={block.muted} theme={theme} />
      ))}
    </ul>
  )
}
