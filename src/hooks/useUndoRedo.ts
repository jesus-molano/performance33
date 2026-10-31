import { useHistoryState } from '../store/hooks'
import { redo, undo } from '../store/history'

export interface UndoRedoApi {
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

/** Undo/redo state and actions for the header buttons. */
export function useUndoRedo(): UndoRedoApi {
  const { canUndo, canRedo } = useHistoryState()
  return { canUndo, canRedo, undo, redo }
}
