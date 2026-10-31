import { useCallback } from 'react'
import { COPY } from '@/config/copy'
import { displayWindowUrl, openDisplayWindow, openTvWindow, tvWindowUrl } from '@/lib/displayWindow'
import type { TvSlot } from '@/lib/routes'
import { useToast } from './useToast'

export interface DisplayWindowApi {
  /** Opens a client's Pantalla popup. Call directly inside a click handler. */
  openDisplay: (clientId: string, day?: number | null, programId?: string | null) => void
  /** Opens the Modo TV popup (1-4 columns). */
  openTv: (slots?: TvSlot[]) => void
}

/**
 * Opens display windows. If the browser blocks the popup, shows a toast whose 'Abrir pantalla'
 * button retries from a fresh click (which popup blockers allow) in a new tab.
 */
export function useDisplayWindow(): DisplayWindowApi {
  const { toast } = useToast()

  const fallback = useCallback(
    (url: string) =>
      toast({
        message: COPY.popupBlocked,
        tone: 'error',
        actionLabel: COPY.openScreen,
        onAction: () => window.open(url, '_blank'),
      }),
    [toast],
  )

  const openDisplay = useCallback<DisplayWindowApi['openDisplay']>(
    (clientId, day, programId) => {
      if (!openDisplayWindow(clientId, day, programId)) fallback(displayWindowUrl(clientId, day, programId))
    },
    [fallback],
  )

  const openTv = useCallback<DisplayWindowApi['openTv']>(
    (slots = []) => {
      if (!openTvWindow(slots)) fallback(tvWindowUrl(slots))
    },
    [fallback],
  )

  return { openDisplay, openTv }
}
