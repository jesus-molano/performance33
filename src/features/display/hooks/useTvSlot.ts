import { useMemo } from 'react'
import type { TvSlot } from '@/lib/routes'
import type { DisplayData } from '@/types'
import { buildClientOptions, shownClientId } from '@/features/display/utils/clientOptions'
import { useBlockFlash } from './useBlockFlash'
import { useDisplayRoutine } from './useDisplayRoutine'

/** One TV column: who it shows (an archived client shows as nobody), its routine + day, flashes after a live edit, picker options. */
export function useTvSlot(data: DisplayData | null, slot: TvSlot) {
  const clientId = shownClientId(data, slot.clientId)
  const { routine, dayNumber, day } = useDisplayRoutine(data, clientId, slot.day)
  const flashBlockIds = useBlockFlash(day)
  const clientOptions = useMemo(() => buildClientOptions(data), [data])
  return { clientId, routine, dayNumber, flashBlockIds, clientOptions }
}
