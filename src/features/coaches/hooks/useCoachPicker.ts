import { useCallback } from 'react'
import { useHashRoute } from '../../../hooks/useHashRoute'
import { navigate, paths } from '../../../lib/routes'
import { useUiStore } from '../../../store'

/** Selecting a profile: remember it on this device and, from '#/', go to the clients list. */
export function useCoachPicker(): (coachId: string) => void {
  const route = useHashRoute()
  const setCurrentCoach = useUiStore((s) => s.setCurrentCoach)
  return useCallback(
    (coachId: string) => {
      setCurrentCoach(coachId)
      if (route.name === 'pick-coach') navigate(paths.clients())
    },
    [route.name, setCurrentCoach],
  )
}
