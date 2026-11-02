import { useCallback } from 'react'
import { findAddExerciseRefusal } from '@/lib/capacity'
import { useAppActions } from '@/store'
import { useEditorUi } from '@/features/editor/store/editorUiStore'
import { useCapacityToast } from './useCapacityToast'
import { useEditorContext } from './useEditorContext'

/**
 * Adds a row to a block, at the end or at `index` (copying series/reps/rest from the row above), and
 * opens it on its name. A full block or day explains itself with a toast.
 */
export function useAddExercise(): (blockId: string, index?: number) => void {
  const { addExercise } = useAppActions()
  const openRow = useEditorUi((s) => s.openRow)
  const { days } = useEditorContext()
  const notifyRefusal = useCapacityToast()
  return useCallback(
    (blockId: string, index?: number) => {
      const id = addExercise(blockId, {}, { index })
      if (id) openRow(id, 'name')
      else notifyRefusal(findAddExerciseRefusal(days, blockId))
    },
    [addExercise, days, notifyRefusal, openRow],
  )
}

export interface SortActions {
  moveExercise: (exerciseId: string, toBlockId: string, toIndex: number) => void
  moveBlock: (blockId: string, toDayId: string, toIndex: number) => void
}

/** Drag-and-drop reorder actions for rows and blocks. */
export function useSortActions(): SortActions {
  const { moveExercise, moveBlock } = useAppActions()
  return { moveExercise, moveBlock }
}
