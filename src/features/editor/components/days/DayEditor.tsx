import type { MenuItem } from '../../../../components/ui'
import { useDisclosure } from '../../../../hooks'
import type { Day } from '../../../../types'
import { useAddBlock } from '../../hooks/useAddBlock'
import { useAddExercise } from '../../hooks/useAddExercise'
import type { WeekContext } from '../../types'
import { AddBlockButton } from '../blocks/AddBlockButton'
import { BlockList } from '../blocks/BlockList'
import { BlockTypePicker } from '../blocks/BlockTypePicker'
import { DayHeader } from './DayHeader'
import { MobileAddBar } from './MobileAddBar'

export interface DayEditorProps {
  day: Day
  days: Day[]
  weeks: WeekContext
  menuItems: MenuItem[]
}

/** Selected day: header, blocks and the add actions. */
export function DayEditor({ day, days, weeks, menuItems }: DayEditorProps) {
  const picker = useDisclosure()
  const addBlock = useAddBlock(day.id)
  const addExercise = useAddExercise()
  const lastBlock = day.blocks.at(-1)

  return (
    <section role="tabpanel" aria-label={day.name} className="mt-3 flex flex-col gap-4">
      <DayHeader day={day} menuItems={menuItems} />
      <BlockList day={day} days={days} weeks={weeks} />
      <AddBlockButton onClick={picker.open} isFirst={day.blocks.length === 0} />
      <MobileAddBar onAddBlock={picker.open} onAddExercise={lastBlock ? () => addExercise(lastBlock.id) : undefined} />
      <BlockTypePicker open={picker.isOpen} onClose={picker.close} onPick={addBlock} />
    </section>
  )
}
