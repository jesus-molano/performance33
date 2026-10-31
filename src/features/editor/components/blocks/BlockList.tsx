import { useAppActions } from '../../../../store'
import type { Day } from '../../../../types'
import type { WeekContext } from '../../types'
import { SortableList } from '../dnd/SortableList'
import { BlockCard } from './BlockCard'

export interface BlockListProps {
  day: Day
  days: Day[]
  weeks: WeekContext
}

/** The day's blocks, reorderable by their grip (or the block '⋯' menu). */
export function BlockList({ day, days, weeks }: BlockListProps) {
  const { moveBlock } = useAppActions()
  return (
    <div className="flex flex-col gap-3">
      <SortableList ids={day.blocks.map((b) => b.id)} onMove={(id, to) => moveBlock(id, day.id, to)}>
        {day.blocks.map((block, index) => (
          <BlockCard key={block.id} block={block} blockIndex={index} day={day} days={days} weeks={weeks} />
        ))}
      </SortableList>
    </div>
  )
}
