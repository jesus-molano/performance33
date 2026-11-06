import { useEffect, useState } from 'react'
import { browserPresence, screensService } from '@/features/screens/services/instance'
import { useScreensStore } from '@/features/screens/store/screensStore'
import { useScreensConnection } from './useScreensConnection'

/** Screens whose TV window is open right now, on this computer or any other. */
export function useScreenPresence(): ReadonlySet<number> {
  useScreensConnection()
  return useScreensStore((state) => state.online)
}

/** Screens whose TV window is open in this browser (what a TV unplugged from this computer affects). */
export function useBrowserScreenPresence(): ReadonlySet<number> {
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set())
  useEffect(() => browserPresence.watch(setOpen), [])
  return open
}

/** A TV window says it shows this screen while it is open: to the whole gym, and to the other windows of this browser. */
export function useTrackScreenPresence(screen: number): void {
  useEffect(() => screensService.presence.track(screen), [screen])
  useEffect(() => (screensService.presence === browserPresence ? undefined : browserPresence.track(screen)), [screen])
}
