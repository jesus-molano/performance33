import { useEffect } from 'react'
import { useRoutineDays, type RoutineDaysParams } from './useRoutineDays'

/** Phone view of a routine: same data as the window, and each day starts from the top of the page. */
export function useMobileDisplay(params: RoutineDaysParams) {
  const routineDays = useRoutineDays(params)
  const { dayNumber } = routineDays
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [dayNumber])
  return routineDays
}
