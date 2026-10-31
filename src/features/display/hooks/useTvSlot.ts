import { useMemo } from 'react'
import type { TvSlot } from '@/lib/routes'
import type { DisplayData } from '@/types'
import { buildClientOptions } from '@/features/display/utils/clientOptions'
import { useBlockFlash } from './useBlockFlash'
import { useDisplayRoutine } from './useDisplayRoutine'

/** One TV column: its routine + day, blocks to flash after a live edit, and its client picker options. */
export function useTvSlot(data: DisplayData | null, slot: TvSlot) {
  const { routine, dayNumber, day } = useDisplayRoutine(data, slot.clientId, slot.day)
  const flashBlockIds = useBlockFlash(day)
  const clientOptions = useMemo(() => buildClientOptions(data, slot.clientId), [data, slot.clientId])
  return { routine, dayNumber, flashBlockIds, clientOptions }
}
