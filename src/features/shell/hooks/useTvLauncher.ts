import { useCallback } from 'react'
import { useDisplayWindow } from '@/hooks'
import { useClients } from '@/store'
import { initialTvSlots } from '@/features/display'

/**
 * Opens the Modo TV window (1-4 columns). If it is already open it is only focused (the columns the
 * coach picked are kept); otherwise it restores this device's last setup or the first clients.
 */
export function useTvLauncher(): () => void {
  const { openTv } = useDisplayWindow()
  const clients = useClients()
  return useCallback(() => openTv(initialTvSlots(clients)), [openTv, clients])
}
