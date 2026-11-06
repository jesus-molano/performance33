import { useCallback } from 'react'
import { useAutoFullscreenPermission, type TvDisplays } from '@/hooks'
import { currentWindowFrame, isWindowOn } from '@/features/display/utils/windowFrame'
import type { FullscreenApi } from './useFullscreen'
import { useFullscreenPrompt, type FullscreenPrompt } from './useFullscreenPrompt'
import { useTvAutoFullscreen } from './useTvAutoFullscreen'
import { useTvWindowControl, type TvWindowControl } from './useTvWindowControl'

export interface TvPlacement extends TvWindowControl {
  /** This screen has a TV now: fullscreen goes there (otherwise the drag guide stays). */
  canPlace: boolean
  /** The 'Pantalla completa' bar, only where the browser needs a click for it. */
  fullscreenPrompt: FullscreenPrompt
}

/**
 * Where a TV window is: fullscreen on its TV by itself when the browser allows it (Chrome policy), else one click on the
 * bar; brought to the laptop, closed or put back on its TV when a dashboard of this browser says so.
 */
export function useTvPlacement(screen: number, fullscreen: FullscreenApi, tvDisplays: TvDisplays): TvPlacement {
  const display = tvDisplays.displayFor(screen)
  const canPlace = display !== null
  const permission = useAutoFullscreenPermission()
  const autoAllowed = permission === 'granted' && canPlace
  const bounds = display?.bounds ?? null
  const isOnTv = useCallback(() => bounds !== null && isWindowOn(currentWindowFrame(), bounds), [bounds])
  const auto = useTvAutoFullscreen({ allowed: autoAllowed, enter: fullscreen.enterFullscreen, isOnTv })
  // Only with a TV for this screen: otherwise (no permission yet, one screen, Firefox) the fullscreen offer would fill
  // the laptop. Not while the browser is still saying whether it needs a click, nor when it does not.
  const needsClick = permission !== null && (!autoAllowed || auto.failed)
  const fullscreenPrompt = useFullscreenPrompt(screen, fullscreen.isFullscreen, canPlace && needsClick)
  const laptop = tvDisplays.detection.displays.find((d) => d.isPrimary)?.area ?? null
  const control = useTvWindowControl({
    screen,
    tvBounds: bounds,
    laptopArea: laptop,
    auto,
    autoAllowed,
    exitFullscreen: fullscreen.exitFullscreen,
    onPlacedNeedsClick: fullscreenPrompt.reopen,
  })
  return { ...control, canPlace, fullscreenPrompt }
}
