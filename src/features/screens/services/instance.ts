import { cloudClient } from '@/lib/cloudClient'
import { createCloudScreens } from './cloudScreens'
import { createLocalScreens } from './localScreens'
import type { ScreensService } from './types'

/** The app's screens: shared through the cloud, or this browser in local test mode. */
export const screensService: ScreensService = cloudClient ? createCloudScreens(cloudClient) : createLocalScreens()
