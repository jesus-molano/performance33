// One backend for the whole app: the gym's Supabase when the app has its address, otherwise the offline demo.

import { HAS_BACKEND } from '@/config/app'
import { createSupabaseClient } from '@/lib/supabase'
import { createCloudBackend } from './cloud'
import { createDemoBackend } from './demo'
import type { MemberBackend } from './types'

export type { BackendMode, MemberBackend } from './types'

export const backend: MemberBackend = HAS_BACKEND ? createCloudBackend(createSupabaseClient()) : createDemoBackend()
