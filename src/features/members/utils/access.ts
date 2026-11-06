// The members' accounts as the card shows them (pure).

import type { MemberRow } from '@shared/booking'
import type { MemberAccess, MemberAccessStatus } from '@/features/members/types'

export function memberAccessFromRow(row: MemberRow): MemberAccess {
  return {
    clientId: row.client_id,
    username: row.username,
    email: row.email,
    active: row.active,
    mustChangePassword: row.must_change_password,
    tempPasswordExpiresAt: row.temp_password_expires_at ? Date.parse(row.temp_password_expires_at) : null,
    createdAt: Date.parse(row.created_at),
  }
}

export function memberAccessStatus(access: MemberAccess, now: number): MemberAccessStatus {
  if (!access.active) return 'paused'
  if (!access.mustChangePassword) return 'active'
  return access.tempPasswordExpiresAt !== null && access.tempPasswordExpiresAt <= now ? 'expired' : 'pending'
}
