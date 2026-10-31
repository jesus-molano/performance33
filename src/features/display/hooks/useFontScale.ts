import { useCallback, useState } from 'react'
import { DISPLAY_STORAGE_KEYS } from '../config/display'
import { parseFontScale, stepFontScale } from '../utils/fontScale'
import { readStorage, writeStorage } from '../utils/storage'

export interface FontScaleApi {
  fontScale: number
  increase: () => void
  decrease: () => void
}

/** A-/A+ text size on top of auto-fit, remembered on this device per screen kind. */
export function useFontScale(screen: 'pantalla' | 'tv'): FontScaleApi {
  const key = `${DISPLAY_STORAGE_KEYS.fontScale}:${screen}`
  const [fontScale, setFontScale] = useState(() => parseFontScale(readStorage(key)))

  const change = useCallback(
    (direction: 1 | -1) =>
      setFontScale((current) => {
        const next = stepFontScale(current, direction)
        writeStorage(key, String(next))
        return next
      }),
    [key],
  )

  const increase = useCallback(() => change(1), [change])
  const decrease = useCallback(() => change(-1), [change])
  return { fontScale, increase, decrease }
}
