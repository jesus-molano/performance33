import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import type { MenuItem } from '../../../components/ui'
import { useToast } from '../../../hooks'
import { useAppActions } from '../../../store'
import { useEditorUi } from '../state/editorUiStore'
import { neighborIndex } from '../utils'

/** '⋯' menu of an exercise row: duplicate, move up/down (accessible alternative to dragging), delete with undo. */
export function useExerciseRowActions(exerciseId: string, blockId: string, index: number, count: number): MenuItem[] {
  const actions = useAppActions()
  const { toastUndo } = useToast()
  const openRow = useEditorUi((s) => s.openRow)

  return useMemo<MenuItem[]>(() => {
    const moveBy = (delta: -1 | 1) => {
      const to = neighborIndex(index, delta, count)
      if (to !== null) actions.moveExercise(exerciseId, blockId, to)
    }
    return [
      {
        label: 'Duplicar',
        icon: Copy,
        onSelect: () => {
          const id = actions.duplicateExercise(exerciseId)
          if (id) openRow(id)
        },
      },
      { label: 'Subir', icon: ArrowUp, disabled: index === 0, onSelect: () => moveBy(-1) },
      { label: 'Bajar', icon: ArrowDown, disabled: index === count - 1, onSelect: () => moveBy(1) },
      'separator',
      {
        label: 'Eliminar ejercicio',
        icon: Trash2,
        danger: true,
        onSelect: () => {
          actions.deleteExercise(exerciseId)
          toastUndo('Ejercicio eliminado')
        },
      },
    ]
  }, [actions, blockId, count, exerciseId, index, openRow, toastUndo])
}
