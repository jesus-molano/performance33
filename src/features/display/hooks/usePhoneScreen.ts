import { PHONE_SCREEN_QUERY } from '@/config/app'
import { useMediaQuery } from '@/hooks'
import { isScreenPopup } from '@/lib/displayWindow'

/** True on phones: the screen routes become normal pages. A TV popup stays a TV window, however narrow (a Pantalla popup is ~640 px). */
export function usePhoneScreen(): boolean {
  return useMediaQuery(PHONE_SCREEN_QUERY) && !isScreenPopup(window.name)
}
