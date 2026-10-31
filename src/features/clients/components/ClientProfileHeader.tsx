import { Archive, ArchiveRestore, CalendarDays, Lock, Pencil, Trash2 } from 'lucide-react'
import { Avatar, Badge, Button, DropdownMenu, type MenuItem } from '@/components/ui'
import { formatDateShort } from '@/lib/dates'
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
  const { archive, restore, remove } = useClientActions()
  const menu: MenuItem[] = [
    client.archived
      ? { label: 'Restaurar cliente', icon: ArchiveRestore, onSelect: () => restore(client) }
      : { label: 'Archivar cliente', icon: Archive, onSelect: () => archive(client) },
    'separator',
    { label: 'Eliminar cliente…', icon: Trash2, danger: true, onSelect: () => remove(client) },
  ]

  return (
    <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center">
      <Avatar firstName={client.firstName} lastName={client.lastName} color={client.color} size="xl" className="size-20 text-2xl sm:size-24 sm:text-3xl" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-fg md:text-3xl">{formatFullName(client.firstName, client.lastName)}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{planLabel(client.plan, client.trainingDays)}</Badge>
          <Badge icon={CalendarDays}>Cliente desde el {formatDateShort(client.startDate)}</Badge>
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
      <div className="flex items-center gap-2">
        <Button variant="secondary" leftIcon={Pencil} onClick={onEdit}>
          Editar datos
        </Button>
        <DropdownMenu items={menu} label="Más acciones del cliente" />
      </div>
    </div>
  )
}
