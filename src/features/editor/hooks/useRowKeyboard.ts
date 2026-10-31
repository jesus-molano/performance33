import { useCallback, type KeyboardEvent } from 'react'
import { breakUndoGroup, useAppActions } from '../../../store'
import { useEditorUi, type RowField } from '../state/editorUiStore'
import { nextRowField, rowFieldOrder } from '../utils'

export interface RowKeyboard {
  /** Focus the field after `field`, or add the next row when it is the last one. */
  advance: (field: RowField) => void
  /** onKeyDown for a basic field: Enter advances, Escape closes the row. */
  onFieldKeyDown: (field: RowField) => (event: KeyboardEvent<HTMLInputElement>) => void
}

/** Fast entry: type, Enter, next. Enter on the last field creates the next row and focuses its name. */
export function useRowKeyboard(exerciseId: string, blockId: string, index: number, showSets: boolean): RowKeyboard {
  const { addExercise } = useAppActions()
  const requestFocus = useEditorUi((s) => s.requestFocus)
  const openRow = useEditorUi((s) => s.openRow)
  const closeRow = useEditorUi((s) => s.closeRow)

  const advance = useCallback(
    (field: RowField) => {
      breakUndoGroup()
      const next = nextRowField(rowFieldOrder(showSets), field)
      if (next) {
        requestFocus(exerciseId, next)
        return
      }
      const id = addExercise(blockId, {}, { index: index + 1 })
      if (id) openRow(id, 'name')
    },
    [showSets, requestFocus, exerciseId, addExercise, blockId, index, openRow],
  )

  const onFieldKeyDown = useCallback(
    (field: RowField) => (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.nativeEvent.isComposing) return
      if (event.key === 'Enter') {
        event.preventDefault()
        advance(field)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        closeRow()
      }
    },
    [advance, closeRow],
  )

  return { advance, onFieldKeyDown }
}
