import { STORAGE_KEYS } from '@/config/app'
import { cloudClient } from '@/lib/cloudClient'
import { readStorage } from '@/lib/safeStorage'
import { readLocalData } from '@/persistence/localStorageRepository'
import { localSessionContext, type LocalClassesLike } from '@/features/sessions/utils/nextDay'
import { createCloudSessions } from './cloudSessions'
import { createLocalSessions } from './localSessions'
import type { LocalSessionRecorder, SessionsService } from './types'

/** Local test mode: the bookings of this browser (localClasses keeps them under this key). */
function readLocalClasses(): LocalClassesLike | null {
  try {
    return JSON.parse(readStorage(STORAGE_KEYS.classes) ?? 'null') as LocalClassesLike | null
  } catch {
    return null
  }
}

const local = createLocalSessions((now) => localSessionContext(readLocalData(), readLocalClasses(), now))

/** Training sessions: the cloud table, or this browser in local test mode. */
export const sessionsService: SessionsService = cloudClient ? createCloudSessions(cloudClient) : local

/** Local test mode only (null with the cloud, where the database records them): called after every change of the TV sections. */
export const localSessionRecorder: LocalSessionRecorder | null = cloudClient ? null : local
