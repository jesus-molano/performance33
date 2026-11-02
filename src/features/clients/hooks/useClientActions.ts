import { useCallback } from 'react'
import { useConfirm, useToast } from '@/hooks'
import { formatFullName } from '@/lib/format'
import { canDeleteClient } from '@/lib/ownership'
import { useAppActions, useAppStore, useCurrentProfile } from '@/store'
import type { Client } from '@/types'
import { describeClientDeletion } from '@/features/clients/utils/clientDeletion'

export interface ClientActionsApi {
  archive: (client: Client) => void
  restore: (client: Client) => void
  canRemove: boolean
  /** Asks first, naming what goes with the client. Offered only on archived clients. */
  remove: (client: Client) => Promise<void>
}

export function useClientActions(): ClientActionsApi {
  const { archiveClient, restoreClient, deleteClient } = useAppActions()
  const canRemove = canDeleteClient(useCurrentProfile())
  const { toast, toastUndo } = useToast()
  const confirm = useConfirm()

  const archive = useCallback(
    (client: Client) => {
      archiveClient(client.id)
      toastUndo(`${client.firstName} archivado`)
    },
    [archiveClient, toastUndo],
  )

  const restore = useCallback(
    (client: Client) => {
      restoreClient(client.id)
      toast({ message: `${client.firstName} vuelve a estar activo`, tone: 'success' })
    },
    [restoreClient, toast],
  )

  const remove = useCallback(
    async (client: Client) => {
      const ok = await confirm({
        title: `¿Eliminar definitivamente a ${formatFullName(client.firstName, client.lastName)}?`,
        description: describeClientDeletion(useAppStore.getState().data, client.id),
        confirmLabel: 'Eliminar definitivamente',
        danger: true,
      })
      if (!ok) return
      deleteClient(client.id)
      toastUndo('Usuario eliminado')
    },
    [confirm, deleteClient, toastUndo],
  )

  return { archive, restore, canRemove, remove }
}
