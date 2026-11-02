import { cloudClient } from '@/lib/cloudClient'
import { LocalStorageRepository } from './localStorageRepository'
import type { Repository } from './repository'
import { createSupabaseGateway } from './supabaseGateway'
import { SupabaseRepository } from './supabaseRepository'
import { TAB_ID } from './tabId'

/** The app's single repository: the shared cloud, or this browser in local test mode. */
export const repository: Repository = cloudClient
  ? new SupabaseRepository(createSupabaseGateway(cloudClient), TAB_ID)
  : new LocalStorageRepository()
