import { useEffect } from 'react'
import type { Block } from '@/types'
import { useEditorUi } from '@/features/editor/store/editorUiStore'

/** Opens the first row of a block that was just created (see useAddBlock). */
export function useFirstRowFocus(block: Block): void {
  const pending = useEditorUi((s) => s.pendingBlockFocus)
  const clearPendingBlock = useEditorUi((s) => s.clearPendingBlock)
  const openRow = useEditorUi((s) => s.openRow)
  const firstId = block.exercises[0]?.id

  useEffect(() => {
    if (pending !== block.id) return
    clearPendingBlock()
    if (firstId) openRow(firstId, 'name')
  }, [pending, block.id, firstId, clearPendingBlock, openRow])
}
