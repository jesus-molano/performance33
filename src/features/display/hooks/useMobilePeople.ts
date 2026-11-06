import { useMemo } from 'react'
import { buildClientOptions } from '@/features/display/utils/clientOptions'
import { useScreenData } from './useScreenData'

/** Phone 'Modo TV': the people with a routine, by full name. Sanitised data only. */
export function useMobilePeople() {
  const screen = useScreenData()
  const people = useMemo(() => buildClientOptions(screen.data).filter((option) => option.hasRoutine), [screen.data])
  return { ...screen, people }
}
