import { useCallback, type KeyboardEvent } from 'react'
import { breakUndoGroup } from '@/store'
import { useEditorUi, type RowField } from '@/features/editor/store/editorUiStore'
import { nextRowField, rowFieldOrder } from '@/features/editor/utils'
import { useAddExercise } from './useAddExercise'

export interface RowKeyboard {
  /** Focus the field after `field`, or add the next row when it is the last one. */
  advance: (field: RowField) => void
  /** Leaves the row (same from every field). An unnamed row is discarded by useDiscardEmptyRows. */
  exit: () => void
  /** onKeyDown for a basic field: Enter advances, Escape leaves the row. */
  onFieldKeyDown: (field: RowField) => (event: KeyboardEvent<HTMLInputElement>) => void
}

/** Fast entry: type, Enter, next. Enter on the last field creates the next row and focuses its name. */
export function useRowKeyboard(exerciseId: string, blockId: string, index: number, showSets: boolean): RowKeyboard {
  const addExercise = useAddExercise()
  const requestFocus = useEditorUi((s) => s.requestFocus)
  const exit = useEditorUi((s) => s.closeRow)

  const advance = useCallback(
    (field: RowField) => {
      breakUndoGroup()
      const next = nextRowField(rowFieldOrder(showSets), field)
      if (next) {
        requestFocus(exerciseId, next)
        return
      }
      addExercise(blockId, index + 1)
    },
    [showSets, requestFocus, exerciseId, addExercise, blockId, index],
  )

  const onFieldKeyDown = useCallback(
    (field: RowField) => (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.nativeEvent.isComposing) return
      if (event.key === 'Enter') {
        event.preventDefault()
        advance(field)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        exit()
      }
    },
    [advance, exit],
  )

  return { advance, exit, onFieldKeyDown }
}
