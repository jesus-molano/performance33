// Where a signed-in person may go, from my_member(), and the checks of the new password (pure).

import type { MyMemberRow } from '@shared/booking/memberRpc.ts'
import { COPY } from '@/config/copy'
import { isAcceptablePassword, PASSWORD_MIN_LENGTH } from '@/lib/accountRules'

/**
 * `none`: no row (no account, paused, archived, or a coach's login); `expired`: the temporary password is too old;
 * `change-password`: still on the temporary one; `ok`: in.
 */
export type MemberAccess = 'none' | 'expired' | 'change-password' | 'ok'

export function memberAccess(member: MyMemberRow | null | undefined): MemberAccess {
  if (!member) return 'none'
  if (member.must_change_password) return member.temporary_password_expired ? 'expired' : 'change-password'
  return 'ok'
}

/** Spanish message for the new-password form, or null when it is fine. */
export function newPasswordError(password: string, repeated: string): string | null {
  if (!isAcceptablePassword(password)) return COPY.password.tooWeak(PASSWORD_MIN_LENGTH)
  return password === repeated ? null : COPY.password.mismatch
}
