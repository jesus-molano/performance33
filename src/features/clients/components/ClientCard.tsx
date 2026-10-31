import { Archive, ArchiveRestore, MonitorPlay, Pencil } from 'lucide-react'
import { Avatar, Badge, Card, DropdownMenu, IconButton, type MenuItem } from '@/components/ui'
import { useDisplayWindow } from '@/hooks'
import { formatFullName } from '@/lib/format'
import { getProgramDisplayName } from '@/lib/program'
import { planLabel } from '@/lib/plans'
import { paths } from '@/lib/routes'
import type { Client } from '@/types'
import { useClientActions } from '@/features/clients/hooks/useClientActions'
import { useClientStatus } from '@/features/clients/hooks/useClientStatus'
import { AlertBadge } from './AlertBadge'
import { ProgramProgressBar } from './ProgramProgressBar'

export interface ClientCardProps {
  client: Client
  alertCount: number
  onEdit: (client: Client) => void
}

export function ClientCard({ client, alertCount, onEdit }: ClientCardProps) {
  const { program, status } = useClientStatus(client.id)
  const { archive, restore } = useClientActions()
  const { openDisplay } = useDisplayWindow()

  const menu: MenuItem[] = [
    { label: 'Editar datos', icon: Pencil, onSelect: () => onEdit(client) },
    { label: 'Abrir en pantalla', icon: MonitorPlay, disabled: !program, onSelect: () => openDisplay(client.id) },
    'separator',
    client.archived
      ? { label: 'Restaurar cliente', icon: ArchiveRestore, onSelect: () => restore(client) }
      : { label: 'Archivar cliente', icon: Archive, onSelect: () => archive(client) },
  ]

  return (
    <Card padding="none" className="relative flex w-full flex-col transition-shadow hover:shadow-pop">
      <a href={paths.client(client.id)} className="flex flex-1 flex-col gap-4 rounded-2xl p-4 pr-14 sm:p-5 sm:pr-14">
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
            <AlertBadge count={alertCount} />
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
      <div className="absolute top-2 right-2 flex flex-col items-center gap-1">
        <DropdownMenu items={menu} label={`Opciones de ${client.firstName}`} />
        {program && (
          <IconButton
            icon={MonitorPlay}
            label={`Abrir la rutina de ${client.firstName} en pantalla`}
            onClick={() => openDisplay(client.id)}
          />
        )}
      </div>
    </Card>
  )
}
