import { ArrowLeft, ArrowRight, Copy, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import type { MenuItem } from '@/components/ui'
import { useToast } from '@/hooks'
import { getAddDayRefusal } from '@/lib/capacity'
import { useAppActions } from '@/store'
import type { Program } from '@/types'
import { neighborIndex } from '@/features/editor/utils'
import { useCapacityToast } from './useCapacityToast'

export interface DayActionsApi {
  /** False at the maximum; the add buttons then explain it with a toast (or hide, on phones). */
  canAddDay: boolean
  addDay: () => void
  moveDay: (dayId: string, toIndex: number) => void
  /** '⋯' menu for the day at `index`. */
  menuItems: (dayId: string, index: number) => MenuItem[]
}

export function useDayActions(program: Program, selectDay: (dayId: string, index?: number) => void): DayActionsApi {
  const actions = useAppActions()
  const { toastUndo } = useToast()
  const notifyRefusal = useCapacityToast()
  const { id: programId, days } = program

  return useMemo<DayActionsApi>(() => {
    const moveBy = (dayId: string, index: number, delta: -1 | 1) => {
      const to = neighborIndex(index, delta, days.length)
      if (to !== null) actions.moveDay(dayId, to)
    }
    const refusal = getAddDayRefusal(days.length)
    return {
      canAddDay: refusal === null,
      addDay: () => {
        notifyRefusal(refusal)
        const id = actions.addDay(programId)
        if (id) selectDay(id, days.length)
      },
      moveDay: actions.moveDay,
      menuItems: (dayId, index) => [
        {
          label: 'Duplicar día',
          icon: Copy,
          onSelect: () => {
            notifyRefusal(refusal)
            const id = actions.duplicateDay(dayId)
            if (id) selectDay(id, index + 1)
          },
        },
        { label: 'Mover antes', icon: ArrowLeft, disabled: index === 0, onSelect: () => moveBy(dayId, index, -1) },
        {
          label: 'Mover después',
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
  }, [actions, days.length, notifyRefusal, programId, selectDay, toastUndo])
}
