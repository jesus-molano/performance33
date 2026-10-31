import { ArrowDown, ArrowUp, Copy, CopyPlus, Files, Shapes, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import type { MenuItem } from '../../../components/ui'
import { useToast } from '../../../hooks'
import { formatDayTitle, plural } from '../../../lib/format'
import { useAppActions } from '../../../store'
import type { BlockType, Day } from '../../../types'
import { neighborIndex } from '../utils'

export interface BlockActionsOptions {
  blockId: string
  dayId: string
  blockIndex: number
  blockCount: number
  /** Days in the program (to know whether copying elsewhere makes sense). */
  dayCount: number
  onChangeType: () => void
  onCopyToDay: () => void
}

export interface BlockActionsApi {
  menuItems: MenuItem[]
  changeType: (type: BlockType) => void
  copyToDay: (day: Day) => void
}

export function useBlockActions(options: BlockActionsOptions): BlockActionsApi {
  const { blockId, dayId, blockIndex, blockCount, dayCount, onChangeType, onCopyToDay } = options
  const actions = useAppActions()
  const { toast, toastUndo } = useToast()

  return useMemo<BlockActionsApi>(() => {
    const moveBy = (delta: -1 | 1) => {
      const to = neighborIndex(blockIndex, delta, blockCount)
      if (to !== null) actions.moveBlock(blockId, dayId, to)
    }
    const canCopy = dayCount > 1
    return {
      changeType: (type) => actions.changeBlockType(blockId, type),
      copyToDay: (day) => {
        if (actions.copyBlockToDay(blockId, day.id)) toast({ message: `Bloque copiado a ${formatDayTitle(day)}`, tone: 'success' })
      },
      menuItems: [
        { label: 'Cambiar tipo de bloque', icon: Shapes, onSelect: onChangeType },
        { label: 'Duplicar bloque', icon: Copy, onSelect: () => actions.duplicateBlock(blockId) },
        { label: 'Copiar a otro día…', icon: CopyPlus, disabled: !canCopy, onSelect: onCopyToDay },
        {
          label: 'Copiar a todos los días',
          icon: Files,
          disabled: !canCopy,
          onSelect: () => {
            const count = actions.copyBlockToAllDays(blockId)
            toast({ message: `Bloque copiado a ${plural(count, 'día', 'días')}`, tone: 'success' })
          },
        },
        { label: 'Subir bloque', icon: ArrowUp, disabled: blockIndex === 0, onSelect: () => moveBy(-1) },
        { label: 'Bajar bloque', icon: ArrowDown, disabled: blockIndex === blockCount - 1, onSelect: () => moveBy(1) },
        'separator',
        {
          label: 'Eliminar bloque',
          icon: Trash2,
          danger: true,
          onSelect: () => {
            actions.deleteBlock(blockId)
            toastUndo('Bloque eliminado')
          },
        },
      ],
    }
  }, [actions, blockCount, blockId, blockIndex, dayCount, dayId, onChangeType, onCopyToDay, toast, toastUndo])
}
