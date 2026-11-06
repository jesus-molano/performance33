import { cloudClient } from '@/lib/cloudClient'
import { getCurrentProfileId, useAppStore } from '@/store'
import { createCloudMembers } from './cloudMembers'
import { createLocalMembers } from './localMembers'
import type { MemberAccessService } from './types'

/** The members' app accounts: the cloud function, or this browser in local test mode (users from the local dataset). */
export const memberAccessService: MemberAccessService = cloudClient
  ? createCloudMembers(cloudClient)
  : createLocalMembers({ clients: () => useAppStore.getState().data.clients, profileId: getCurrentProfileId })
