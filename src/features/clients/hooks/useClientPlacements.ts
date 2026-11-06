import { useMemo } from 'react'
import { useClients } from '@/store'
import { useScreens } from '@/features/screens'
import { placementsByClient, type ClientPlacements } from '@/features/clients/utils/screenPlacements'

/** Where every active user shows on the TVs, live (any coach or device sending or clearing). */
export function useClientPlacements(): ClientPlacements {
  const { screens } = useScreens()
  const clients = useClients()
  const activeIds = useMemo(() => new Set(clients.map((c) => c.id)), [clients])
  return useMemo(() => placementsByClient(screens, activeIds), [screens, activeIds])
}
