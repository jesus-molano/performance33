import { Avatar, Badge, Card, DropdownMenu } from '@/components/ui'
import { formatFullName } from '@/lib/format'
import { getProgramDisplayName } from '@/lib/program'
import { planLabel } from '@/lib/plans'
import { paths } from '@/lib/routes'
import type { Client } from '@/types'
import { useClientEntry } from '@/features/clients/hooks/useClientEntry'
import { ClientScreenButton } from './ClientScreenButton'
import { ImportantBadge } from './ImportantBadge'
import { ProgramProgressBar } from './ProgramProgressBar'

export interface ClientCardProps {
  client: Client
  importantCount: number
  onEdit: (client: Client) => void
}

export function ClientCard({ client, importantCount, onEdit }: ClientCardProps) {
  const { program, status, menu } = useClientEntry(client, onEdit)

  return (
    <Card padding="none" className="flex w-full flex-col transition-shadow hover:shadow-pop">
      <a href={paths.client(client.id)} className="flex min-w-0 flex-1 flex-col gap-4 rounded-t-2xl p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="flex items-center gap-3">
          <Avatar firstName={client.firstName} lastName={client.lastName} color={client.color} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold text-fg">{formatFullName(client.firstName, client.lastName)}</p>
            <p className="truncate text-sm text-fg-muted">{planLabel(client.plan, client.trainingDays)}</p>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={status.tone}>{status.label}</Badge>
            <ImportantBadge count={importantCount} />
            {client.archived && <Badge>Archivado</Badge>}
          </div>
          {program && (
            <>
              <ProgramProgressBar status={status} />
              <p className="truncate text-sm text-fg-subtle">{getProgramDisplayName(program)}</p>
            </>
          )}
        </div>
      </a>
      <div className="flex items-center justify-end gap-1 border-t border-line px-2 py-1.5 sm:px-3">
        <ClientScreenButton client={client} program={program} />
        <DropdownMenu items={menu} label={`Opciones de ${client.firstName}`} />
      </div>
    </Card>
  )
}
