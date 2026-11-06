import { Avatar, Badge, DropdownMenu } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatFullName } from '@/lib/format'
import { planLabel } from '@/lib/plans'
import type { ProgramStatus } from '@/lib/program'
import { paths } from '@/lib/routes'
import type { Client } from '@/types'
import { CLIENT_ROW_ACTIONS_WIDTH, CLIENT_ROW_COLUMNS } from '@/features/clients/config'
import { useClientEntry } from '@/features/clients/hooks/useClientEntry'
import { elapsedWeeks } from '@/features/clients/utils/programSummary'
import type { ClientPlacement } from '@/features/clients/utils/screenPlacements'
import { ClientScreenButton } from './ClientScreenButton'
import { ImportantBadge } from './ImportantBadge'
import { ProgramProgressBar } from './ProgramProgressBar'
import { ScreenPlacementBadge } from './ScreenPlacementBadge'

export interface ClientRowProps {
  client: Client
  importantCount: number
  placements: readonly ClientPlacement[]
  onEdit: (client: Client) => void
}

function WeekProgress({ status }: { status: ProgramStatus }) {
  if (!status.info) return <div className="hidden xl:block" />
  return (
    <div className="order-last flex w-full items-center gap-2 xl:order-none xl:w-auto">
      <ProgramProgressBar status={status} className="flex-1" />
      <span className="text-sm text-fg-muted tabular">
        {elapsedWeeks(status.info)}/{status.info.totalWeeks}
      </span>
    </div>
  )
}

/** One line per client on wide screens; below lg it stacks: name and plan, then status and progress. */
export function ClientRow({ client, importantCount, placements, onEdit }: ClientRowProps) {
  const { program, status, menu } = useClientEntry(client, onEdit)
  const plan = planLabel(client.plan, client.trainingDays)

  return (
    <li className="flex items-center gap-1 pr-2 transition-colors hover:bg-canvas">
      <a href={paths.client(client.id)} className={cn(CLIENT_ROW_COLUMNS, 'min-w-0 flex-1 rounded-xl py-2.5 pl-3 sm:pl-4')}>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar firstName={client.firstName} lastName={client.lastName} color={client.color} size="md" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg">{formatFullName(client.firstName, client.lastName)}</p>
            <p className="truncate text-sm text-fg-muted xl:hidden">{plan}</p>
          </div>
        </div>
        <p className="hidden truncate text-sm text-fg-muted xl:block">{plan}</p>
        <div className="flex flex-wrap items-center gap-1.5 xl:contents">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={status.tone}>{status.label}</Badge>
            <ScreenPlacementBadge placements={placements} />
          </div>
          <WeekProgress status={status} />
          <div className="flex flex-wrap items-center gap-1.5">
            <ImportantBadge count={importantCount} />
            {client.archived && <Badge>Archivado</Badge>}
          </div>
        </div>
      </a>
      <div className={cn(CLIENT_ROW_ACTIONS_WIDTH, 'flex shrink-0 items-center justify-end gap-1')}>
        <ClientScreenButton client={client} program={program} iconOnPhones />
        <DropdownMenu items={menu} label={`Opciones de ${client.firstName}`} />
      </div>
    </li>
  )
}
