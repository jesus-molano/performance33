import { CAPACITY_TEXTS } from '@/config/capacity'
import { useDisclosure } from '@/hooks'
import { getDayCapacity, type DayCapacity } from '@/lib/capacity'
import type { BlockType, Day } from '@/types'
import { useAddBlock } from './useAddBlock'
import { useAddExercise } from './useAddExercise'
import { useCapacityToast } from './useCapacityToast'

export interface DayAddActions {
  capacity: DayCapacity
  /** Why the day takes no more blocks, or null. */
  blockFullText: string | null
  pickerOpen: boolean
  closePicker: () => void
  pickBlock: (type: BlockType) => void
  openPicker: () => void
  /** Same, but when the day is full it says why instead of opening the picker (phones' sticky bar). */
  tryAddBlock: () => void
  /** Adds a row to the last block, or says why it does not fit. Undefined when the day has no blocks. */
  addToLastBlock: (() => void) | undefined
}

/** What can be added to the selected day, from the block picker and the phones' sticky bar. */
export function useDayAddActions(day: Day): DayAddActions {
  const picker = useDisclosure()
  const pickBlock = useAddBlock(day)
  const addExercise = useAddExercise()
  const notifyRefusal = useCapacityToast()
  const capacity = getDayCapacity(day)
  const lastBlock = day.blocks.at(-1)

  return {
    capacity,
    blockFullText: capacity.addBlockRefusal && CAPACITY_TEXTS.refusals[capacity.addBlockRefusal],
    pickerOpen: picker.isOpen,
    closePicker: picker.close,
    pickBlock,
    openPicker: picker.open,
    tryAddBlock: () => {
      if (capacity.addBlockRefusal) notifyRefusal(capacity.addBlockRefusal)
      else picker.open()
    },
    addToLastBlock: lastBlock ? () => addExercise(lastBlock.id) : undefined,
  }
}
