import { Archive, ArchiveRestore, MonitorPlay, Pencil } from 'lucide-react'
import type { MenuItem } from '@/components/ui'
import { useDisplayWindow } from '@/hooks'
import type { Client } from '@/types'
import { useClientActions } from './useClientActions'
import { useClientStatus, type ClientStatus } from './useClientStatus'

export interface ClientEntry extends ClientStatus {
  menu: MenuItem[]
  openOnScreen: () => void
}

/** What a card and a list row share: the routine's status, the '⋯' menu and 'Abrir en pantalla'. */
export function useClientEntry(client: Client, onEdit: (client: Client) => void): ClientEntry {
  const { program, status } = useClientStatus(client.id)
  const { archive, restore } = useClientActions()
  const { openDisplay } = useDisplayWindow()
  const openOnScreen = () => openDisplay(client.id)

  const menu: MenuItem[] = [
    { label: 'Editar datos', icon: Pencil, onSelect: () => onEdit(client) },
    { label: 'Abrir en pantalla', icon: MonitorPlay, disabled: !program, onSelect: openOnScreen },
    'separator',
    client.archived
      ? { label: 'Restaurar cliente', icon: ArchiveRestore, onSelect: () => restore(client) }
      : { label: 'Archivar cliente', icon: Archive, onSelect: () => archive(client) },
  ]

  return { program, status, menu, openOnScreen }
}
