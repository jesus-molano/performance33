import type { ScreenLike } from '@/lib/screenDetails'
import { CONTROLS_IDLE_MS, WINDOW_HINT_MS } from '@/features/display/config/display'
import { useFontScale, type FontScaleApi } from './useFontScale'
import { useFullscreen, type FullscreenApi } from './useFullscreen'
import { useIdleVisibility } from './useIdleVisibility'
import { useTimedFlag } from './useTimedFlag'

export interface ScreenChrome extends FontScaleApi, FullscreenApi {
  /** Overlay controls visible (fade out when idle). */
  controlsVisible: boolean
  /** One-off 'arrastra esta ventana a la tele' hint. */
  hintVisible: boolean
}

/** Shared window behaviour of Pantalla and Modo TV: fading controls, hint, A-/A+, fullscreen (on its TV, when known). */
export function useScreenChrome(screen: string, fullscreenTarget: ScreenLike | null = null): ScreenChrome {
  const fontScale = useFontScale(screen)
  const fullscreen = useFullscreen(fullscreenTarget)
  const controlsVisible = useIdleVisibility(CONTROLS_IDLE_MS)
  const hintVisible = useTimedFlag(WINDOW_HINT_MS)
  return { ...fontScale, ...fullscreen, controlsVisible, hintVisible }
}
