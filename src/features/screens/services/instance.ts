import { cloudClient } from '@/lib/cloudClient'
import { createCloudScreens } from './cloudScreens'
import { createLocalPresence } from './localPresence'
import { createLocalScreens } from './localScreens'
import type { ScreenPresence, ScreensService } from './types'

/** TV windows of this browser (BroadcastChannel), whatever the mode: what this computer itself has open. */
export const browserPresence: ScreenPresence = createLocalPresence()

/** The app's screens: shared through the cloud, or this browser in local test mode. */
export const screensService: ScreensService = cloudClient ? createCloudScreens(cloudClient) : createLocalScreens(browserPresence)
