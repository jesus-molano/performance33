import type { MenuItem } from '@/components/ui'
import type { Day } from '@/types'
import type { SendToScreenInput } from '@/features/screens'
import { useDayAddActions } from '@/features/editor/hooks/useDayAddActions'
import { AddBlockButton } from '@/features/editor/components/blocks/AddBlockButton'
import { DayCapacityIndicator } from '@/features/editor/components/capacity/DayCapacityIndicator'
import { BlockList } from '@/features/editor/components/blocks/BlockList'
import { BlockTypePicker } from '@/features/editor/components/blocks/BlockTypePicker'
import { DayHeader } from './DayHeader'
import { MobileAddBar } from './MobileAddBar'

export interface DayEditorProps {
  day: Day
  menuItems: MenuItem[]
  /** The day as a TV section can show it, or null when it is not in the current routine. */
  screenTarget: SendToScreenInput | null
}

/** Selected day: header, blocks and the add actions. */
export function DayEditor({ day, menuItems, screenTarget }: DayEditorProps) {
  const add = useDayAddActions(day)

  return (
    <section role="tabpanel" aria-label={day.name} className="mt-3 flex flex-col gap-4">
      <DayHeader day={day} menuItems={menuItems} screenTarget={screenTarget} />
      <DayCapacityIndicator capacity={add.capacity} />
      <BlockList day={day} />
      <AddBlockButton onClick={add.openPicker} isFirst={day.blocks.length === 0} disabledReason={add.blockFullText} />
      {day.blocks.length > 0 && <MobileAddBar onAddBlock={add.tryAddBlock} onAddExercise={add.addToLastBlock} />}
      <BlockTypePicker open={add.pickerOpen} onClose={add.closePicker} onPick={add.pickBlock} />
    </section>
  )
}
