import { PHONE_SCREEN_QUERY } from '@/config/app'
import { isScreenPopup } from '@/lib/displayWindow'
import { useMediaQuery } from './useMediaQuery'

/**
 * True on phones (the same test as isPhoneScreen, which openTv uses): no TV window opens from here, so the screen
 * routes become normal pages and the dashboard's 'Pantallas' is a remote control. A TV popup stays a TV window,
 * however narrow (a Pantalla popup is ~640 px).
 */
export function usePhoneScreen(): boolean {
  return useMediaQuery(PHONE_SCREEN_QUERY) && !isScreenPopup(window.name)
}
