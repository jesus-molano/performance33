import { Avatar, Badge, Button, Select } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { StaffMember, StaffRole } from '@/types'
import { ROLE_LABELS, ROLE_OPTIONS } from '@/features/team/config'

export interface TeamMemberRowProps {
  member: StaffMember
  isSelf: boolean
  busy: boolean
  onRoleChange: (member: StaffMember, role: StaffRole) => void
  onActiveChange: (member: StaffMember, active: boolean) => void
}

/** One person: role and access can change, except your own. */
export function TeamMemberRow({ member, isSelf, busy, onRoleChange, onActiveChange }: TeamMemberRowProps) {
  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
      <div className={cn('flex min-w-0 flex-1 items-center gap-3', !member.active && 'opacity-55')}>
        <Avatar firstName={member.name} color={member.color} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-md font-medium text-fg">{member.name}</p>
          <p className="truncate text-sm text-fg-muted">{member.email}</p>
        </div>
        {isSelf && <Badge tone="brand">Eres tú</Badge>}
        {!member.active && <Badge tone="neutral">Sin acceso</Badge>}
      </div>
      {isSelf ? (
        <p className="text-sm font-medium text-fg-muted">{ROLE_LABELS[member.role]}</p>
      ) : (
        <div className="flex items-center gap-2">
          <Select
            aria-label={`Rol de ${member.name}`}
            options={ROLE_OPTIONS}
            value={member.role}
            disabled={busy || !member.active}
            onChange={(role) => onRoleChange(member, role)}
            containerClassName="min-w-40 flex-1"
          />
          <Button variant="secondary" disabled={busy} onClick={() => onActiveChange(member, !member.active)}>
            {member.active ? 'Desactivar' : 'Reactivar'}
          </Button>
        </div>
      )}
    </li>
  )
}
