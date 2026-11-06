import type { MenuItem } from '@/components/ui'
import type { Client } from '@/types'
import { clientMenuItems } from '@/features/clients/utils/clientMenu'
import { useClientActions } from './useClientActions'
import { useClientStatus, type ClientStatus } from './useClientStatus'

export interface ClientEntry extends ClientStatus {
  menu: MenuItem[]
}

/** What a card and a list row share: the routine's status and the '⋯' menu ('Pantalla' is its own button). */
export function useClientEntry(client: Client, onEdit: (client: Client) => void): ClientEntry {
  const { program, status } = useClientStatus(client.id)
  const { archive, restore, canRemove, remove } = useClientActions()
  const menu = clientMenuItems(client, { edit: onEdit, archive, restore, remove: canRemove ? remove : undefined })
  return { program, status, menu }
}
