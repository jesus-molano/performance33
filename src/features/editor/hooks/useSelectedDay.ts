import { useCallback, useState } from 'react'
import { clamp } from '../../../lib/numbers'
import type { Day, Program } from '../../../types'

interface Selection {
  id: string | null
  index: number
}

export interface SelectedDay {
  day: Day | null
  /** 0-based; -1 when the program has no days. */
  dayIndex: number
  /** `index` is only needed for a day created in this same tick (not rendered yet). */
  selectDay: (dayId: string, index?: number) => void
}

/**
 * Selected day tab. Survives reorders (tracked by id); when the selected day disappears
 * (deleted, undone) it falls back to the day now at the same position.
 */
export function useSelectedDay(program: Program): SelectedDay {
  const [selection, setSelection] = useState<Selection>({ id: program.days[0]?.id ?? null, index: 0 })
  const { days } = program
  const found = days.findIndex((d) => d.id === selection.id)
  const dayIndex = days.length === 0 ? -1 : found !== -1 ? found : clamp(selection.index, 0, days.length - 1)

  const selectDay = useCallback(
    (dayId: string, index?: number) =>
      setSelection({ id: dayId, index: index ?? Math.max(0, days.findIndex((d) => d.id === dayId)) }),
    [days],
  )

  return { day: days[dayIndex] ?? null, dayIndex, selectDay }
}
