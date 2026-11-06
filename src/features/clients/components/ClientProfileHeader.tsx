import { Archive, ArchiveRestore, CalendarDays, Lock, Pencil } from 'lucide-react'
import { Avatar, Badge, Button, DropdownMenu, type MenuItem } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { formatFullName } from '@/lib/format'
import { planLabel } from '@/lib/plans'
import type { Client } from '@/types'
import { useClientActions } from '@/features/clients/hooks/useClientActions'
import { ClientScreenPlacement } from './ClientScreenPlacement'

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

  const memberSince = `Usuario desde el ${formatDate(client.startDate)}`

  return (
    <div className="mb-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-5">
      <Avatar firstName={client.firstName} lastName={client.lastName} color={client.color} size="lg" className="sm:row-span-2 sm:size-24 sm:text-3xl" />
      <div className="min-w-0">
        <h1 className="text-2xl leading-tight font-semibold tracking-tight wrap-break-word text-fg md:text-3xl">{formatFullName(client.firstName, client.lastName)}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{planLabel(client.plan, client.trainingDays)}</Badge>
          <span className="hidden sm:contents">
            <Badge icon={CalendarDays}>{memberSince}</Badge>
          </span>
          {client.archived && <Badge tone="warning">Archivado</Badge>}
          <ClientScreenPlacement client={client} />
        </div>
      </div>
      <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:col-start-3 sm:row-start-1">
        <Button variant="secondary" leftIcon={Pencil} onClick={onEdit} className="flex-1 sm:flex-none">
          Editar datos
        </Button>
        <DropdownMenu items={menu} label="Más acciones del usuario" />
      </div>
      <div className="col-span-2 row-start-2 space-y-1.5 text-md text-fg-muted empty:hidden sm:col-span-2 sm:col-start-2">
        <p className="flex items-center gap-1.5 sm:hidden">
          <CalendarDays size={15} aria-hidden className="shrink-0" />
          {memberSince}
        </p>
        {client.goal && (
          <p className="flex items-start gap-1.5">
            <Lock size={15} aria-label="Solo monitores" className="mt-1 shrink-0 text-private-icon" />
            <span>
              <span className="font-medium text-fg">Objetivo:</span> {client.goal}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
