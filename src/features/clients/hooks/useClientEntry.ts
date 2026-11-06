import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react'
import type { MenuItem } from '@/components/ui'
import type { Client } from '@/types'
import { useClientActions } from './useClientActions'
import { useClientStatus, type ClientStatus } from './useClientStatus'

export interface ClientEntry extends ClientStatus {
  menu: MenuItem[]
}

/** What a card and a list row share: the routine's status and the '⋯' menu ('Pantalla' is its own button). */
export function useClientEntry(client: Client, onEdit: (client: Client) => void): ClientEntry {
  const { program, status } = useClientStatus(client.id)
  const { archive, restore, canRemove, remove } = useClientActions()

  const menu: MenuItem[] = [
    { label: 'Editar datos', icon: Pencil, onSelect: () => onEdit(client) },
    'separator',
    client.archived
      ? { label: 'Restaurar usuario', icon: ArchiveRestore, onSelect: () => restore(client) }
      : { label: 'Archivar usuario', icon: Archive, onSelect: () => archive(client) },
    ...(client.archived && canRemove
      ? [{ label: 'Eliminar usuario…', icon: Trash2, danger: true, onSelect: () => remove(client) }]
      : []),
  ]

  return { program, status, menu }
}
