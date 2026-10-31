import { useEffect } from 'react'
import { useAppActions } from '@/store'
import { useEditorUi } from '@/features/editor/store/editorUiStore'

/**
 * The 'type, Enter, next' flow always leaves a fresh row open. Whenever the open row changes or
 * closes (another row, collapse, Escape, 'Listo', leaving the editor) a row that never got a name
 * is removed silently, so it never shows up as 'Ejercicio sin nombre' or reaches the TV.
 */
export function useDiscardEmptyRows(): void {
  const { discardUnnamedExercise } = useAppActions()
  useEffect(() => {
    const stop = useEditorUi.subscribe((state, previous) => {
      const left = previous.expandedExerciseId
      if (left && left !== state.expandedExerciseId) discardUnnamedExercise(left)
    })
    return () => {
      useEditorUi.getState().closeRow()
      stop()
    }
  }, [discardUnnamedExercise])
}
