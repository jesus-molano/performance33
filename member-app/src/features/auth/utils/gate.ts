// Which screen a person belongs on right now (pure): every route checks this before showing anything.

import type { MemberAccess } from './access'

export type SessionStatus = 'loading' | 'signed-in' | 'signed-out'

/**
 * `offline`: the demo notice (no connection set up, not yet accepted); `login`; `change-password`; `expired` and
 * `no-access` (signed in, but nothing to show); `app`: the tabs.
 */
export type Gate = 'loading' | 'offline' | 'login' | 'change-password' | 'expired' | 'no-access' | 'app'

export interface GateInput {
  session: SessionStatus
  /** The app runs as the offline demo (no Supabase address). */
  demo: boolean
  demoAccepted: boolean
  /** Null while my_member() is still loading. */
  access: MemberAccess | null
}

export function gateFor({ session, demo, demoAccepted, access }: GateInput): Gate {
  if (demo && !demoAccepted) return 'offline'
  if (session === 'loading') return 'loading'
  if (session === 'signed-out') return 'login'
  switch (access) {
    case null:
      return 'loading'
    case 'none':
      return 'no-access'
    case 'expired':
      return 'expired'
    case 'change-password':
      return 'change-password'
    case 'ok':
      return 'app'
  }
}

export const GATE_ROUTES = {
  offline: '/sin-conexion',
  login: '/entrar',
  'change-password': '/cambiar-contrasena',
  expired: '/sin-acceso',
  'no-access': '/sin-acceso',
  app: '/',
} as const satisfies Record<Exclude<Gate, 'loading'>, string>
