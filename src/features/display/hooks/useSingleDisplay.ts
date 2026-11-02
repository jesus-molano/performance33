import { useCallback } from 'react'
import { useDisplayShortcuts } from './useDisplayShortcuts'
import { useRoutineDays, type RoutineDaysParams } from './useRoutineDays'
import { useScreenChrome } from './useScreenChrome'

/** Everything the Pantalla window needs: live routine, day switching, flash, chrome. */
export function useSingleDisplay(params: RoutineDaysParams) {
  const routineDays = useRoutineDays(params)
  const { goToDay, dayNumber, currentDay } = routineDays
  const chrome = useScreenChrome('pantalla')
  const prevDay = useCallback(() => goToDay(dayNumber - 1), [goToDay, dayNumber])
  const nextDay = useCallback(() => goToDay(dayNumber + 1), [goToDay, dayNumber])

  useDisplayShortcuts({
    prevDay,
    nextDay,
    fullscreen: chrome.toggleFullscreen,
    bigger: chrome.increase,
    smaller: chrome.decrease,
  })

  return { ...routineDays, chrome, dayTitle: currentDay?.title ?? '', prevDay, nextDay }
}
