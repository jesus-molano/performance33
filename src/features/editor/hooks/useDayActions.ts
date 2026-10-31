import { ArrowLeft, ArrowRight, Copy, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import type { MenuItem } from '@/components/ui'
import { useToast } from '@/hooks'
import { useAppActions } from '@/store'
import type { Program } from '@/types'
import { neighborIndex } from '@/features/editor/utils'

export interface DayActionsApi {
  addDay: () => void
  moveDay: (dayId: string, toIndex: number) => void
  /** '⋯' menu for the day at `index`. */
  menuItems: (dayId: string, index: number) => MenuItem[]
}

export function useDayActions(program: Program, selectDay: (dayId: string, index?: number) => void): DayActionsApi {
  const actions = useAppActions()
  const { toastUndo } = useToast()
  const { id: programId, days } = program

  return useMemo<DayActionsApi>(() => {
    const moveBy = (dayId: string, index: number, delta: -1 | 1) => {
      const to = neighborIndex(index, delta, days.length)
      if (to !== null) actions.moveDay(dayId, to)
    }
    return {
      addDay: () => {
        const id = actions.addDay(programId)
        if (id) selectDay(id, days.length)
      },
      moveDay: actions.moveDay,
      menuItems: (dayId, index) => [
        {
          label: 'Duplicar día',
          icon: Copy,
          onSelect: () => {
            const id = actions.duplicateDay(dayId)
            if (id) selectDay(id, index + 1)
          },
        },
        { label: 'Mover a la izquierda', icon: ArrowLeft, disabled: index === 0, onSelect: () => moveBy(dayId, index, -1) },
        {
          label: 'Mover a la derecha',
          icon: ArrowRight,
          disabled: index === days.length - 1,
          onSelect: () => moveBy(dayId, index, 1),
        },
        'separator',
        {
          label: 'Eliminar día',
          icon: Trash2,
          danger: true,
          onSelect: () => {
            actions.deleteDay(dayId)
            toastUndo('Día eliminado')
          },
        },
      ],
    }
  }, [actions, days.length, programId, selectDay, toastUndo])
}
