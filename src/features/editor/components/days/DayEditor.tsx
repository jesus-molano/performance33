import type { MenuItem } from '@/components/ui'
import { useDisclosure } from '@/hooks'
import type { Day } from '@/types'
import { useAddBlock } from '@/features/editor/hooks/useAddBlock'
import { useAddExercise } from '@/features/editor/hooks/useAddExercise'
import { AddBlockButton } from '@/features/editor/components/blocks/AddBlockButton'
import { BlockList } from '@/features/editor/components/blocks/BlockList'
import { BlockTypePicker } from '@/features/editor/components/blocks/BlockTypePicker'
import { DayHeader } from './DayHeader'
import { MobileAddBar } from './MobileAddBar'

export interface DayEditorProps {
  day: Day
  menuItems: MenuItem[]
}

/** Selected day: header, blocks and the add actions. */
export function DayEditor({ day, menuItems }: DayEditorProps) {
  const picker = useDisclosure()
  const addBlock = useAddBlock(day.id)
  const addExercise = useAddExercise()
  const lastBlock = day.blocks.at(-1)

  return (
    <section role="tabpanel" aria-label={day.name} className="mt-3 flex flex-col gap-4">
      <DayHeader day={day} menuItems={menuItems} />
      <BlockList day={day} />
      <AddBlockButton onClick={picker.open} isFirst={day.blocks.length === 0} />
      <MobileAddBar onAddBlock={picker.open} onAddExercise={lastBlock ? () => addExercise(lastBlock.id) : undefined} />
      <BlockTypePicker open={picker.isOpen} onClose={picker.close} onPick={addBlock} />
    </section>
  )
}
