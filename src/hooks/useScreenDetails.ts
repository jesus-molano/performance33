import { useSyncExternalStore } from 'react'
import { WINDOW_MANAGEMENT_PERMISSIONS } from '@/config/app'
import {
  createScreenDetector,
  type PermissionLike,
  type ScreenDetailsLike,
  type ScreenDetection,
  type ScreenDetector,
} from '@/lib/screenDetails'

export interface ScreenDetailsApi extends ScreenDetection {
  /** Asks the browser for the permission and looks for the TVs. Call it directly in a click handler. */
  request: () => void
}

type WindowWithScreens = Window & { getScreenDetails?: () => Promise<ScreenDetailsLike> }

async function queryWindowManagement(): Promise<PermissionLike | null> {
  for (const name of WINDOW_MANAGEMENT_PERMISSIONS) {
    try {
      return await navigator.permissions.query({ name: name as PermissionName })
    } catch {
      // This browser knows the permission by its other name, or not at all.
    }
  }
  return null
}

let detector: ScreenDetector | null = null

/** One detector for the whole window: every hook shares what it found. */
function screenDetector(): ScreenDetector {
  detector ??= createScreenDetector({
    // Browsers with the API make window.screen an EventTarget (its change event says when a TV is extended).
    screen: window.screen instanceof EventTarget ? window.screen : new EventTarget(),
    getScreenDetails: (window as WindowWithScreens).getScreenDetails?.bind(window),
    queryPermission: queryWindowManagement,
  })
  return detector
}

/** The screens of this computer (the TVs extended with Win+K among them), followed live. */
export function useScreenDetails(): ScreenDetailsApi {
  const source = screenDetector()
  const detection = useSyncExternalStore(source.subscribe, source.getSnapshot)
  return { ...detection, request: () => void source.request() }
}
