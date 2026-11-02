// Demo team. Local test mode signs in as these people; the demo notes and routines are signed by them.
// With the cloud nobody has these ids, so loading the demo there signs everything as the admin.

import type { StaffMember } from '@/types'

export const SEED_ADMIN: StaffMember = {
  id: 'coach-carla',
  email: 'carla@demo.local',
  name: 'Carla',
  color: '#d6449a',
  role: 'admin',
  active: true,
}

export const SEED_MONITOR: StaffMember = {
  id: 'coach-dani',
  email: 'dani@demo.local',
  name: 'Dani',
  color: '#2563eb',
  role: 'monitor',
  active: true,
}

export const SEED_TEAM: readonly StaffMember[] = [SEED_ADMIN, SEED_MONITOR]
