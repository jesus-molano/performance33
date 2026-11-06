import { cloudClient } from '@/lib/cloudClient'
import { localSessionRecorder } from '@/features/sessions'
import { sectionId } from '@/features/screens/utils/sections'
import { createCloudScreens } from './cloudScreens'
import { createLocalPresence } from './localPresence'
import { createLocalScreens } from './localScreens'
import type { ScreenSection } from '@/features/screens/types'
import type { ScreenPresence, ScreensService } from './types'

/** TV windows of this browser (BroadcastChannel), whatever the mode: what this computer itself has open. */
export const browserPresence: ScreenPresence = createLocalPresence()

const shown = (sections: readonly ScreenSection[]) => sections.map((s) => ({ id: sectionId(s), clientId: s.clientId, day: s.day }))

/** The app's screens: shared through the cloud, or this browser in local test mode (which also records the sessions). */
export const screensService: ScreensService = cloudClient
  ? createCloudScreens(cloudClient)
  : createLocalScreens(browserPresence, (before, after) => localSessionRecorder?.record(shown(before), shown(after)))
