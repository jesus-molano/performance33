import { cn } from '@/lib/cn'
import type { DisplayBlock } from '@/lib/display'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DisplayExerciseRow } from './DisplayExerciseRow'

interface DisplayExerciseListProps {
  block: DisplayBlock
  week: number | null
  theme: DisplayThemeClasses
}

/** Exercise rows; supersets get a vertical bracket joining A1/A2. Warm-up/mobility rows are smaller. */
export function DisplayExerciseList({ block, week, theme }: DisplayExerciseListProps) {
  const bracketed = block.type === 'superset'
  return (
    <ul
      className={cn(
        'mt-[0.45em] divide-y',
        theme.rowDivider,
        bracketed && cn('ml-[0.2em] border-l-[0.22em] pl-[0.7em]', theme.accentBorder),
      )}
    >
      {block.exercises.map((line) => (
        <DisplayExerciseRow key={line.id} line={line} week={week} compact={block.muted} theme={theme} />
      ))}
    </ul>
  )
}
