import { UserX } from 'lucide-react'
import { Avatar, Badge, DropdownMenu, type MenuItem } from '@/components/ui'
import { planLabel } from '@/lib/plans'
import { paths } from '@/lib/routes'
import { ROSTER_COPY } from '@/features/classes/config/copy'
import type { RosterEntry } from '@/features/classes/utils/slotView'

export interface RosterRowProps {
  entry: RosterEntry
  menu: MenuItem[]
}

/** A person in a class: number in the waitlist, name (to their page), plan, "Forzada" and the ⋯ menu. */
export function RosterRow({ entry, menu }: RosterRowProps) {
  const { client, booking, position, name } = entry
  return (
    <li className="flex min-h-14 items-center gap-3 py-1.5">
      {position !== null && (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fg/5 text-sm font-semibold text-fg-muted tabular">{position}</span>
      )}
      {client ? (
        <Avatar firstName={client.firstName} lastName={client.lastName} color={client.color} size="sm" />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fg/5 text-fg-subtle">
          <UserX size={16} aria-hidden />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {client ? (
          <a href={paths.client(client.id)} className="truncate text-md font-medium text-fg hover:underline">
            {name}
          </a>
        ) : (
          <span className="truncate text-md text-fg-muted">{name}</span>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {client && <span className="text-sm text-fg-muted">{planLabel(client.plan)}</span>}
          {booking.forced && (
            <Badge tone="warning" size="sm">
              {ROSTER_COPY.forced}
            </Badge>
          )}
        </div>
      </div>
      {menu.length > 0 && <DropdownMenu items={menu} label={ROSTER_COPY.personMenu(name)} triggerSize="sm" />}
    </li>
  )
}
