import { useEffect } from 'react'
import { screensService } from '@/features/screens/services/instance'
import { useScreensStore } from '@/features/screens/store/screensStore'
import { useScreensConnection } from './useScreensConnection'

/** Screens whose TV window is open right now, on this computer or any other. */
export function useScreenPresence(): ReadonlySet<number> {
  useScreensConnection()
  return useScreensStore((state) => state.online)
}

/** A TV window says it shows this screen while it is open. */
export function useTrackScreenPresence(screen: number): void {
  useEffect(() => screensService.presence.track(screen), [screen])
}
