import { useCallback } from 'react'
import { useToast } from '@/hooks'
import { navigate, paths } from '@/lib/routes'
import { useCoaches, useCurrentCoach, useUiStore } from '@/store'
import type { Coach } from '@/types'

export interface CoachSwitcherApi {
  current: Coach | null
  coaches: Coach[]
  switchTo: (coach: Coach) => void
  manageCoaches: () => void
  showPicker: () => void
}

export function useCoachSwitcher(): CoachSwitcherApi {
  const current = useCurrentCoach()
  const coaches = useCoaches()
  const setCurrentCoach = useUiStore((s) => s.setCurrentCoach)
  const { toast } = useToast()

  const switchTo = useCallback(
    (coach: Coach) => {
      if (coach.id === current?.id) return
      setCurrentCoach(coach.id)
      toast({ message: `Hola, ${coach.name}. Tus notas irán firmadas con tu nombre.`, tone: 'success' })
    },
    [current?.id, setCurrentCoach, toast],
  )

  const manageCoaches = useCallback(() => navigate(paths.settings('monitores')), [])
  const showPicker = useCallback(() => navigate(paths.pickCoach()), [])

  return { current, coaches, switchTo, manageCoaches, showPicker }
}
