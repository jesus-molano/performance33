import { cloudClient } from '@/lib/cloudClient'
import { getCurrentProfileId, useAppStore } from '@/store'
import { createCloudClasses } from './cloudClasses'
import { createLocalClasses } from './localClasses'
import type { ClassesService } from './types'

/** The gym's classes: the cloud functions, or this browser in local test mode (its users come from the local dataset). */
export const classesService: ClassesService = cloudClient
  ? createCloudClasses(cloudClient)
  : createLocalClasses({ clients: () => useAppStore.getState().data.clients, profileId: getCurrentProfileId })
