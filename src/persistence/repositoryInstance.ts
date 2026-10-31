import { LocalStorageRepository } from './localStorageRepository'
import type { Repository } from './repository'

/** The app's single repository. Swap for a Supabase implementation here. */
export const repository: Repository = new LocalStorageRepository()
