import { useCallback } from 'react'
import { paths, replaceRoute } from '../../../lib/routes'
import { wrapDayNumber } from '../utils/days'
import { findClientFirstName } from '../utils/tvSlots'
import { useBlockFlash } from './useBlockFlash'
import { useDisplayRoutine } from './useDisplayRoutine'
import { useDisplayShortcuts } from './useDisplayShortcuts'
import { useScreenChrome } from './useScreenChrome'
import { useScreenData } from './useScreenData'

export interface SingleDisplayParams {
  clientId: string
  day: number | null
  programId: string | null
}

/** Everything the Pantalla window needs: live routine, day switching (in the URL), flash, chrome. */
export function useSingleDisplay({ clientId, day, programId }: SingleDisplayParams) {
  const screen = useScreenData()
  const { routine, dayNumber, day: currentDay } = useDisplayRoutine(screen.data, clientId, day, programId)
  const chrome = useScreenChrome('pantalla')
  const flashBlockIds = useBlockFlash(currentDay)
  const dayCount = routine?.days.length ?? 0

  const goToDay = useCallback(
    (target: number) => {
      if (dayCount > 1) replaceRoute(paths.display(clientId, wrapDayNumber(target, dayCount), programId))
    },
    [clientId, programId, dayCount],
  )
  const prevDay = useCallback(() => goToDay(dayNumber - 1), [goToDay, dayNumber])
  const nextDay = useCallback(() => goToDay(dayNumber + 1), [goToDay, dayNumber])

  useDisplayShortcuts({
    prevDay,
    nextDay,
    fullscreen: chrome.toggleFullscreen,
    bigger: chrome.increase,
    smaller: chrome.decrease,
  })

  return {
    ...screen,
    chrome,
    routine,
    dayNumber,
    dayCount,
    dayTitle: currentDay?.title ?? '',
    flashBlockIds,
    prevDay,
    nextDay,
    clientFirstName: findClientFirstName(screen.data, clientId),
  }
}
