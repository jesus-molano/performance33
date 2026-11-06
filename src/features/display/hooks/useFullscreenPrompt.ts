import { useCallback, useEffect, useState } from 'react'
import { DISPLAY_STORAGE_KEYS, FULLSCREEN_PROMPT_MS } from '@/features/display/config/display'
import { readSessionStorage, writeSessionStorage } from '@/lib/safeStorage'

export interface FullscreenPrompt {
  visible: boolean
  dismiss: () => void
  /** Shows it again (the window was just put back on its TV). */
  reopen: () => void
}

const promptKey = (screen: number) => `${DISPLAY_STORAGE_KEYS.fullscreenPrompt}${screen}`

/**
 * The 'Pantalla completa' bar of a TV window that just opened: the browser only goes fullscreen after a click in the
 * window. Once per window (a reload does not bring it back): it goes when used, dismissed, after FULLSCREEN_PROMPT_MS
 * or when the coach clicks somewhere else, so it never stays over a routine.
 */
export function useFullscreenPrompt(screen: number, isFullscreen: boolean, enabled: boolean): FullscreenPrompt {
  const [done, setDone] = useState(() => isFullscreen || readSessionStorage(promptKey(screen)) !== null)
  if (isFullscreen && !done) setDone(true)
  const visible = enabled && !done && !isFullscreen

  const dismiss = useCallback(() => {
    writeSessionStorage(promptKey(screen), '1')
    setDone(true)
  }, [screen])

  const reopen = useCallback(() => setDone(false), [])

  useEffect(() => {
    if (!visible) return
    const timer = window.setTimeout(dismiss, FULLSCREEN_PROMPT_MS)
    window.addEventListener('blur', dismiss)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('blur', dismiss)
    }
  }, [visible, dismiss])

  return { visible, dismiss, reopen }
}
