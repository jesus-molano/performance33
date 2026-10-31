import { CONTROLS_IDLE_MS, WINDOW_HINT_MS } from '../config/display'
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

/** Shared window behaviour of Pantalla and Modo TV: fading controls, hint, A-/A+, fullscreen. */
export function useScreenChrome(screen: 'pantalla' | 'tv'): ScreenChrome {
  const fontScale = useFontScale(screen)
  const fullscreen = useFullscreen()
  const controlsVisible = useIdleVisibility(CONTROLS_IDLE_MS)
  const hintVisible = useTimedFlag(WINDOW_HINT_MS)
  return { ...fontScale, ...fullscreen, controlsVisible, hintVisible }
}
