// Demo team. Local test mode signs in as these people; the demo notes and routines are signed by them.
// With the cloud nobody has these ids, so loading the demo there signs everything as the admin.

import type { Profile } from '@/types'

export const SEED_ADMIN: Profile = {
  id: 'coach-carla',
  username: 'admin',
  email: 'carla@demo.local',
  name: 'Carla',
  color: '#d6449a',
  role: 'admin',
  active: true,
  mustChangePassword: false,
  hasOwnPassword: true,
  temporaryPasswordExpired: false,
  googleConnected: false,
}

export const SEED_MONITOR: Profile = {
  id: 'coach-dani',
  username: 'monitor',
  email: 'dani@demo.local',
  name: 'Dani',
  color: '#2563eb',
  role: 'monitor',
  active: true,
  mustChangePassword: false,
  hasOwnPassword: true,
  temporaryPasswordExpired: false,
  googleConnected: false,
}

/** A new account that has not entered yet: it tries out the first-login step. */
export const SEED_NEW_MONITOR: Profile = {
  id: 'coach-nora',
  username: 'nueva',
  email: null,
  name: 'Nora',
  color: '#059669',
  role: 'monitor',
  active: true,
  mustChangePassword: true,
  hasOwnPassword: false,
  temporaryPasswordExpired: false,
  googleConnected: false,
}

export const SEED_TEAM: readonly Profile[] = [SEED_ADMIN, SEED_MONITOR, SEED_NEW_MONITOR]

/** Local test mode only, and shown on its login page: these passwords protect nothing. */
export const LOCAL_TEST_PASSWORDS: Readonly<Record<string, string>> = {
  [SEED_ADMIN.username]: 'admin1234',
  [SEED_MONITOR.username]: 'monitor1234',
  [SEED_NEW_MONITOR.username]: 'nueva1234',
}
