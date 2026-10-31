import { useCallback } from 'react'
import { useAppActions } from '@/store'
import { useEditorUi } from '@/features/editor/store/editorUiStore'

/** Appends a row to a block (copying series/reps/rest from the row above) and opens it on its name. */
export function useAddExercise(): (blockId: string) => void {
  const { addExercise } = useAppActions()
  const openRow = useEditorUi((s) => s.openRow)
  return useCallback(
    (blockId: string) => {
      const id = addExercise(blockId)
      if (id) openRow(id, 'name')
    },
    [addExercise, openRow],
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
