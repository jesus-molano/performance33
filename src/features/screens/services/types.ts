// What the screens store needs from where screens live: the cloud tables, or this browser in local test mode.

import type { ScreenConfig, ScreenSection, ScreensEvent, ScreensSnapshot } from '@/features/screens/types'

/** Which TV windows are open right now. */
export interface ScreenPresence {
  /** This window shows that screen until the returned function is called (or the window closes). */
  track: (screen: number) => () => void
  /** Called now and on every change with the screens whose window is open somewhere. */
  watch: (listener: (online: ReadonlySet<number>) => void) => () => void
}

export interface ScreensService {
  load: () => Promise<ScreensSnapshot>
  /** `onlyNew`: a screen that already exists is left as it is (two windows creating the defaults at once). A new
   * number of sections empties the sections it leaves out or brings back (schema.sql: trim_screen_sections). */
  saveScreens: (screens: ScreenConfig[], onlyNew?: boolean) => Promise<void>
  /** Its sections go with it. */
  removeScreen: (id: number) => Promise<void>
  /** Their screens must exist. */
  saveSections: (sections: ScreenSection[]) => Promise<void>
  /** `onMissed`: changes may have been lost (connected, reconnected, changed in another window): reload. */
  subscribe: (onEvent: (event: ScreensEvent) => void, onMissed: () => void) => () => void
  presence: ScreenPresence
  /** The last good read, for a window opened without connection. Only where reads can fail (the cloud). */
  cache?: { read: () => ScreensSnapshot | null; write: (snapshot: ScreensSnapshot) => void; clear: () => void }
}
