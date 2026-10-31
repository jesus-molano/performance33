import { useCallback, useMemo } from 'react'
import { useDisplayWindow } from '../../../hooks/useDisplayWindow'
import { useClients } from '../../../store'
import { pickDefaultTvSlots } from '../utils/tvSlots'

/** Opens the 3-column Modo TV window prefilled with the first clients that have a routine. */
export function useTvLauncher(): () => void {
  const { openTv } = useDisplayWindow()
  const clients = useClients()
  const slots = useMemo(() => pickDefaultTvSlots(clients), [clients])
  return useCallback(() => openTv(slots), [openTv, slots])
}
