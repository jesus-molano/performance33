import { CalendarDays } from 'lucide-react'
import { Avatar, Badge, DropdownMenu } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { formatFullName } from '@/lib/format'
import { planLabel } from '@/lib/plans'
import type { Client } from '@/types'
import { CLIENT_MENU_COPY, CLIENT_PROFILE_COPY } from '@/features/clients/config'
import { useClientActions } from '@/features/clients/hooks/useClientActions'
import { clientMenuItems } from '@/features/clients/utils/clientMenu'
import { ClientProfileDetails } from './ClientProfileDetails'
import { ClientScreenPlacement } from './ClientScreenPlacement'

export interface ClientProfileHeaderProps {
  client: Client
  onEdit: () => void
}

/**
 * Avatar, name and '⋯' (Editar datos, archive) on one row; plan and screen pills on one line; the private goal.
 * Compact on phones so the current routine starts high; from sm a bigger avatar beside it all.
 */
export function ClientProfileHeader({ client, onEdit }: ClientProfileHeaderProps) {
  const { archive, restore } = useClientActions()
  const menu = clientMenuItems(client, { edit: onEdit, archive, restore })
  const plan = planLabel(client.plan, client.trainingDays)
  const memberSince = CLIENT_PROFILE_COPY.memberSince(formatDate(client.startDate))

  return (
    <header className="mb-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 sm:mb-6 sm:gap-x-5 sm:gap-y-2.5">
      <Avatar firstName={client.firstName} lastName={client.lastName} color={client.color} className="sm:row-span-3 sm:size-20 sm:self-start sm:text-2xl" />
      <h1 className="line-clamp-2 text-xl leading-tight font-semibold tracking-tight wrap-break-word text-fg sm:text-3xl">
        {formatFullName(client.firstName, client.lastName)}
      </h1>
      <DropdownMenu items={menu} label={CLIENT_MENU_COPY.label} className="-mr-2 sm:mr-0" />
      <div className="col-span-3 flex min-w-0 items-center gap-1.5 sm:col-span-1 sm:col-start-2 sm:flex-wrap sm:gap-2">
        {/* The plan gives way first on narrow phones: the screen pill's day matters more on the floor. */}
        <span title={plan} className="inline-flex min-w-12 shrink-[100]">
          <Badge tone="brand" size="sm" className="max-w-full min-w-0">
            <span className="truncate">{plan}</span>
          </Badge>
        </span>
        {client.archived && (
          <Badge tone="warning" size="sm" className="shrink-0">
            {CLIENT_PROFILE_COPY.archived}
          </Badge>
        )}
        <span className="hidden sm:contents">
          <Badge icon={CalendarDays} size="sm">
            {memberSince}
          </Badge>
        </span>
        <ClientScreenPlacement client={client} />
      </div>
      <ClientProfileDetails goal={client.goal || undefined} memberSince={memberSince} className="col-span-3 empty:hidden sm:col-span-1 sm:col-start-2" />
    </header>
  )
}
