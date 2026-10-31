import { useCallback } from 'react'
import { BLOCK_TYPE_META } from '@/config/blockTypes'
import { useAppActions } from '@/store'
import type { BlockType } from '@/types'
import { useEditorUi } from '@/features/editor/store/editorUiStore'

/** Adds a block to a day and opens its first row (warm-up/mobility start as free text instead). */
export function useAddBlock(dayId: string | null) {
  const { addBlock } = useAppActions()
  const focusFirstRowOf = useEditorUi((s) => s.focusFirstRowOf)

  return useCallback(
    (type: BlockType) => {
      if (!dayId) return
      const withExercise = !BLOCK_TYPE_META[type].allowsText
      const id = addBlock(dayId, type, { withExercise })
      if (id && withExercise) focusFirstRowOf(id)
    },
    [addBlock, dayId, focusFirstRowOf],
  )
}
