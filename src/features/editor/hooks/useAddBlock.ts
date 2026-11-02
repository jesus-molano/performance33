import { useCallback } from 'react'
import { BLOCK_TYPE_META } from '@/config/blockTypes'
import { getAddBlockRefusal } from '@/lib/capacity'
import { useAppActions } from '@/store'
import type { BlockType, Day } from '@/types'
import { useEditorUi } from '@/features/editor/store/editorUiStore'
import { useCapacityToast } from './useCapacityToast'

/** Adds a block to a day and opens its first row (warm-up/mobility start as free text instead). */
export function useAddBlock(day: Day) {
  const { addBlock } = useAppActions()
  const focusFirstRowOf = useEditorUi((s) => s.focusFirstRowOf)
  const notifyRefusal = useCapacityToast()

  return useCallback(
    (type: BlockType) => {
      const withExercise = !BLOCK_TYPE_META[type].allowsText
      const id = addBlock(day.id, type, { withExercise })
      if (!id) notifyRefusal(getAddBlockRefusal(day, withExercise ? 1 : 0))
      else if (withExercise) focusFirstRowOf(id)
    },
    [addBlock, day, focusFirstRowOf, notifyRefusal],
  )
}
