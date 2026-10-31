import { useCallback, useSyncExternalStore } from 'react'
import { MOBILE_MEDIA_QUERY } from '../config/app'

/** Live result of a CSS media query. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  const getSnapshot = () => window.matchMedia(query).matches
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** True below 768 px (bottom sheets, single column, sticky day tabs). */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_MEDIA_QUERY)
}
