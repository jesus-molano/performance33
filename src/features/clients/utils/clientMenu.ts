import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react'
import type { MenuItem } from '@/components/ui'
import type { Client } from '@/types'
import { CLIENT_MENU_COPY } from '@/features/clients/config'

export interface ClientMenuHandlers<C> {
  edit: (client: C) => void
  archive: (client: C) => void
  restore: (client: C) => void
  /** Offered only on archived users, and only when given (who may delete). */
  remove?: (client: C) => void
}

/** The user's '⋯': 'Editar datos' first, then archive or restore, then delete for the archived. */
export function clientMenuItems<C extends Pick<Client, 'archived'>>(client: C, handlers: ClientMenuHandlers<C>): MenuItem[] {
  const { remove } = handlers
  return [
    { label: CLIENT_MENU_COPY.edit, icon: Pencil, onSelect: () => handlers.edit(client) },
    'separator',
    client.archived
      ? { label: CLIENT_MENU_COPY.restore, icon: ArchiveRestore, onSelect: () => handlers.restore(client) }
      : { label: CLIENT_MENU_COPY.archive, icon: Archive, onSelect: () => handlers.archive(client) },
    ...(client.archived && remove ? [{ label: CLIENT_MENU_COPY.remove, icon: Trash2, danger: true, onSelect: () => remove(client) }] : []),
  ]
}
