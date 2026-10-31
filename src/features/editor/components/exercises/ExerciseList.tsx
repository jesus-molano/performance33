import { Plus } from 'lucide-react'
import { blockShowsSets } from '../../../../lib/blocks'
import { cn } from '../../../../lib/cn'
import { getExerciseLabels } from '../../../../lib/format'
import { useAppActions } from '../../../../store'
import type { Block } from '../../../../types'
import { useAddExercise } from '../../hooks/useAddExercise'
import { useFirstRowFocus } from '../../hooks/useFirstRowFocus'
import type { WeekContext } from '../../types'
import { SortableList } from '../dnd/SortableList'
import { ExerciseRow } from './ExerciseRow'

export interface ExerciseListProps {
  block: Block
  blockIndex: number
  dayBlocks: Block[]
  weeks: WeekContext
}

/** Reorderable rows of a block + '+ Añadir ejercicio'. Superset rows are joined by a pink bracket. */
export function ExerciseList({ block, blockIndex, dayBlocks, weeks }: ExerciseListProps) {
  const { moveExercise } = useAppActions()
  const addExercise = useAddExercise()
  useFirstRowFocus(block)
  const labels = getExerciseLabels(dayBlocks, blockIndex)
  const showSets = blockShowsSets(block.type)

  return (
    <div className="flex flex-col gap-2">
      {block.exercises.length > 0 && (
        <ul
          className={cn(
            'flex flex-col gap-1',
            block.type === 'superset' && 'border-l-[3px] border-brand-strong/50 pl-1.5 md:pl-2',
          )}
        >
          <SortableList ids={block.exercises.map((e) => e.id)} onMove={(id, to) => moveExercise(id, block.id, to)}>
            {block.exercises.map((entry, index) => (
              <ExerciseRow
                key={entry.id}
                entry={entry}
                index={index}
                count={block.exercises.length}
                blockId={block.id}
                label={labels[index] ?? null}
                showSets={showSets}
                weeks={weeks}
              />
            ))}
          </SortableList>
        </ul>
      )}
      <button
        type="button"
        onClick={() => addExercise(block.id)}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-[15px] font-medium text-fg-muted transition-colors hover:border-brand-strong hover:bg-brand-soft hover:text-brand-strong"
      >
        <Plus size={18} aria-hidden />
        Añadir ejercicio
      </button>
    </div>
  )
}
