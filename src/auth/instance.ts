import { cloudClient, createPasswordCheckClient } from '@/lib/cloudClient'
import { createLocalBackend } from './localBackend'
import { createSupabaseAuth } from './supabaseAuth'
import { createSupabaseTeam } from './supabaseTeam'
import type { AuthService, TeamService } from './types'

// The demo login only exists when there is no cloud configured: nothing can reach it otherwise.
const backend: { auth: AuthService; team: TeamService } = cloudClient
  ? { auth: createSupabaseAuth(cloudClient, createPasswordCheckClient), team: createSupabaseTeam(cloudClient) }
  : createLocalBackend()

export const auth = backend.auth
export const teamService = backend.team
