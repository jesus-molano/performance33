import { useCallback } from 'react'
import { paths, replaceRoute } from '@/lib/routes'
import { wrapDayNumber } from '@/features/display/utils/days'
import { findClientFirstName } from '@/features/display/utils/tvSlots'
import { useBlockFlash } from './useBlockFlash'
import { useDisplayRoutine } from './useDisplayRoutine'
import { useScreenData } from './useScreenData'

export interface RoutineDaysParams {
  clientId: string
  day: number | null
  programId: string | null
}

/** One client's live routine with its selected day (in the URL) and the blocks to flash. Sanitised data only. */
export function useRoutineDays({ clientId, day, programId }: RoutineDaysParams) {
  const screen = useScreenData()
  const { routine, dayNumber, day: currentDay } = useDisplayRoutine(screen.data, clientId, day, programId)
  const flashBlockIds = useBlockFlash(currentDay)
  const dayCount = routine?.days.length ?? 0

  const goToDay = useCallback(
    (target: number) => {
      if (dayCount > 1) replaceRoute(paths.display(clientId, wrapDayNumber(target, dayCount), programId))
    },
    [clientId, programId, dayCount],
  )

  return {
    ...screen,
    routine,
    dayNumber,
    dayCount,
    currentDay,
    flashBlockIds,
    goToDay,
    clientFirstName: findClientFirstName(screen.data, clientId),
  }
}
