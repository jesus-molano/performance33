import { useMemo } from 'react'
import { useAppActions } from '@/store'

export interface DayFieldsApi {
  rename: (name: string) => void
  finishRename: () => void
  setLabel: (label: string) => void
}

export function useDayFields(dayId: string): DayFieldsApi {
  const { updateDay, settleDayNames } = useAppActions()
  return useMemo(
    () => ({
      rename: (name: string) => updateDay(dayId, { name }),
      finishRename: () => settleDayNames(dayId),
      setLabel: (label: string) => updateDay(dayId, { label }),
    }),
    [updateDay, settleDayNames, dayId],
  )
}
