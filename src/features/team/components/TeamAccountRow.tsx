import { KeyRound, Trash2, UserCheck, UserX } from 'lucide-react'
import { Avatar, Badge, DropdownMenu, Select, type MenuItem } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Profile, ProfileRole } from '@/types'
import { ROLE_LABELS, ROLE_OPTIONS, TEAM_COPY } from '@/features/team/config'

export interface TeamAccountRowProps {
  account: Profile
  isSelf: boolean
  busy: boolean
  onRoleChange: (account: Profile, role: ProfileRole) => void
  onActiveChange: (account: Profile, active: boolean) => void
  onResetPassword: (account: Profile) => void
  onRemove: (account: Profile) => void
}

/** One person: name, how they enter, role and status. Everything can change, except your own access. */
export function TeamAccountRow({ account, isSelf, busy, onRoleChange, onActiveChange, onResetPassword, onRemove }: TeamAccountRowProps) {
  const menu: MenuItem[] = [
    { label: 'Dar una contraseña nueva', icon: KeyRound, disabled: busy, onSelect: () => onResetPassword(account) },
    account.active
      ? { label: 'Desactivar', icon: UserX, disabled: busy, onSelect: () => onActiveChange(account, false) }
      : { label: 'Reactivar', icon: UserCheck, disabled: busy, onSelect: () => onActiveChange(account, true) },
    'separator',
    { label: 'Eliminar', icon: Trash2, danger: true, disabled: busy, onSelect: () => onRemove(account) },
  ]
  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
      <div className={cn('flex min-w-0 flex-1 items-center gap-3', !account.active && 'opacity-55')}>
        <Avatar firstName={account.name} color={account.color} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-md font-medium text-fg">{account.name}</p>
          <p className="truncate text-sm text-fg-muted">
            {account.username} · {account.email ?? TEAM_COPY.noEmail}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5 empty:hidden">
            {isSelf && <Badge tone="brand">Eres tú</Badge>}
            {!account.active && <Badge tone="neutral">{TEAM_COPY.statusNoAccess}</Badge>}
            {account.active && account.mustChangePassword && <Badge tone="warning">{TEAM_COPY.statusPending}</Badge>}
            {account.googleConnected && <Badge tone="info">{TEAM_COPY.googleConnectedBadge}</Badge>}
          </div>
        </div>
      </div>
      {isSelf ? (
        <p className="text-sm font-medium text-fg-muted">{ROLE_LABELS[account.role]}</p>
      ) : (
        <div className="flex items-center gap-2">
          <Select
            aria-label={`Rol de ${account.name}`}
            options={ROLE_OPTIONS}
            value={account.role}
            disabled={busy || !account.active}
            onChange={(role) => onRoleChange(account, role)}
            containerClassName="min-w-40 flex-1"
          />
          <DropdownMenu items={menu} label={`Opciones de ${account.name}`} />
        </div>
      )}
    </li>
  )
}
