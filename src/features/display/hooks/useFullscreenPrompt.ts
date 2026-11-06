import { useState } from 'react'

export interface FullscreenPrompt {
  visible: boolean
  dismiss: () => void
}

/**
 * The big 'Pantalla completa' button of a TV window that just opened: the browser only goes fullscreen after a click
 * in the window. It goes for good once used or dismissed, so it never covers a routine again.
 */
export function useFullscreenPrompt(isFullscreen: boolean, enabled: boolean): FullscreenPrompt {
  const [done, setDone] = useState(isFullscreen)
  if (isFullscreen && !done) setDone(true)
  return { visible: enabled && !done && !isFullscreen, dismiss: () => setDone(true) }
}
