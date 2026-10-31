import { useMemo } from 'react'
import { useAppActions } from '@/store'

export interface DayFieldsApi {
  rename: (name: string) => void
  setLabel: (label: string) => void
}

export function useDayFields(dayId: string): DayFieldsApi {
  const { updateDay } = useAppActions()
  return useMemo(
    () => ({
      rename: (name: string) => updateDay(dayId, { name }),
      setLabel: (label: string) => updateDay(dayId, { label }),
    }),
    [updateDay, dayId],
  )
}
