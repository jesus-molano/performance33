import { KeyRound, Trash2, UserCheck, UserX } from 'lucide-react'
import { Badge, DropdownMenu, type BadgeTone, type MenuItem } from '@/components/ui'
import { MEMBER_ACCESS_COPY } from '@/features/members/config/copy'
import type { MemberAccess, MemberAccessStatus } from '@/features/members/types'

const STATUS_TONE: Record<MemberAccessStatus, BadgeTone> = {
  pending: 'warning',
  expired: 'danger',
  active: 'success',
  paused: 'neutral',
}

export interface MemberAccessDetailsProps {
  access: MemberAccess
  status: MemberAccessStatus
  busy: boolean
  onResetPassword: () => void
  onSetActive: (active: boolean) => void
  onRemove: () => void
}

/** How the user enters, the state of the account and '⋯' (new password, pause or reactivate, remove). */
export function MemberAccessDetails({ access, status, busy, onResetPassword, onSetActive, onRemove }: MemberAccessDetailsProps) {
  const menu: MenuItem[] = [
    { label: MEMBER_ACCESS_COPY.reset, icon: KeyRound, disabled: busy, onSelect: onResetPassword },
    access.active
      ? { label: MEMBER_ACCESS_COPY.pause, icon: UserX, disabled: busy, onSelect: () => onSetActive(false) }
      : { label: MEMBER_ACCESS_COPY.resume, icon: UserCheck, disabled: busy, onSelect: () => onSetActive(true) },
    'separator',
    { label: MEMBER_ACCESS_COPY.remove, icon: Trash2, danger: true, disabled: busy, onSelect: onRemove },
  ]
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-md text-fg">{MEMBER_ACCESS_COPY.usernameLine(access.username)}</p>
        {access.email && <p className="truncate text-sm text-fg-muted">{access.email}</p>}
        <Badge tone={STATUS_TONE[status]} className="mt-1">
          {MEMBER_ACCESS_COPY.status[status]}
        </Badge>
      </div>
      <DropdownMenu items={menu} label={MEMBER_ACCESS_COPY.menuLabel} />
    </div>
  )
}
