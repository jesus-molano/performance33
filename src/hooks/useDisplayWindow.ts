import { useCallback } from 'react'
import { displayWindowUrl, openDisplayWindow, openTvWindow, tvWindowUrl } from '../lib/displayWindow'
import type { TvSlot } from '../lib/routes'
import { useToastStore } from '../store/toastStore'

export interface DisplayWindowApi {
  /** Opens a client's Pantalla popup. Call directly inside a click handler. */
  openDisplay: (clientId: string, day?: number | null, programId?: string | null) => void
  /** Opens the 3-column Modo TV popup. */
  openTv: (slots?: TvSlot[]) => void
}

/**
 * Opens display windows. If the browser blocks the popup, shows a toast whose 'Abrir pantalla'
 * button retries from a fresh click (which popup blockers allow) in a new tab.
 */
export function useDisplayWindow(): DisplayWindowApi {
  const show = useToastStore((s) => s.show)

  const fallback = useCallback(
    (url: string) =>
      show({
        message: 'El navegador ha bloqueado la ventana.',
        tone: 'error',
        actionLabel: 'Abrir pantalla',
        onAction: () => window.open(url, '_blank'),
      }),
    [show],
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
