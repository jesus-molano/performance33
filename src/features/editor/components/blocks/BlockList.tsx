import type { Day } from '@/types'
import { useSortActions } from '@/features/editor/hooks/useAddExercise'
import { SortableList } from '@/features/editor/components/dnd/SortableList'
import { BlockCard } from './BlockCard'

/** The day's blocks, reorderable by their grip (or the block '⋯' menu). */
export function BlockList({ day }: { day: Day }) {
  const { moveBlock } = useSortActions()
  return (
    <div className="flex flex-col gap-3">
      <SortableList ids={day.blocks.map((b) => b.id)} onMove={(id, to) => moveBlock(id, day.id, to)}>
        {day.blocks.map((block, index) => (
          <BlockCard key={block.id} block={block} blockIndex={index} day={day} />
        ))}
      </SortableList>
    </div>
  )
}
