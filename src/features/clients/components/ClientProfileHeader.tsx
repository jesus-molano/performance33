import { Archive, ArchiveRestore, CalendarDays, Lock, Pencil } from 'lucide-react'
import { Avatar, Badge, Button, DropdownMenu, type MenuItem } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { formatFullName } from '@/lib/format'
import { planLabel } from '@/lib/plans'
import type { Client } from '@/types'
import { useClientActions } from '@/features/clients/hooks/useClientActions'

export interface ClientProfileHeaderProps {
  client: Client
  onEdit: () => void
}

/** Avatar, name, plan and the client-level actions. */
export function ClientProfileHeader({ client, onEdit }: ClientProfileHeaderProps) {
  const { archive, restore } = useClientActions()
  const menu: MenuItem[] = [
    client.archived
      ? { label: 'Restaurar usuario', icon: ArchiveRestore, onSelect: () => restore(client) }
      : { label: 'Archivar usuario', icon: Archive, onSelect: () => archive(client) },
  ]

  return (
    <div className="mb-6 flex flex-wrap items-start gap-x-4 gap-y-3 sm:flex-nowrap sm:items-center sm:gap-x-5">
      <Avatar firstName={client.firstName} lastName={client.lastName} color={client.color} size="lg" className="sm:size-24 sm:text-3xl" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-fg md:text-3xl">{formatFullName(client.firstName, client.lastName)}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{planLabel(client.plan, client.trainingDays)}</Badge>
          <Badge icon={CalendarDays}>Usuario desde el {formatDate(client.startDate)}</Badge>
          {client.archived && <Badge tone="warning">Archivado</Badge>}
        </div>
        {client.goal && (
          <p className="mt-3 flex items-start gap-1.5 text-md text-fg-muted">
            <Lock size={15} aria-label="Solo monitores" className="mt-1 shrink-0 text-private-icon" />
            <span>
              <span className="font-medium text-fg">Objetivo:</span> {client.goal}
            </span>
          </p>
        )}
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Button variant="secondary" leftIcon={Pencil} onClick={onEdit} className="flex-1 sm:flex-none">
          Editar datos
        </Button>
        <DropdownMenu items={menu} label="Más acciones del usuario" />
      </div>
    </div>
  )
}
