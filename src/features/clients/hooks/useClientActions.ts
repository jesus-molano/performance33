import { useCallback } from 'react'
import { useConfirm, useToast } from '@/hooks'
import { formatFullName } from '@/lib/format'
import { navigate, paths } from '@/lib/routes'
import { useAppActions } from '@/store'
import type { Client } from '@/types'

export interface ClientActionsApi {
  archive: (client: Client) => void
  restore: (client: Client) => void
  /** Asks first; offers archiving as the gentler option in the description. */
  remove: (client: Client) => Promise<void>
}

export function useClientActions(): ClientActionsApi {
  const { archiveClient, restoreClient, deleteClient } = useAppActions()
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
        title: `¿Eliminar a ${formatFullName(client.firstName, client.lastName)}?`,
        description: 'Se borrarán sus rutinas y notas internas. Si solo ha dejado de venir, mejor archívalo.',
        confirmLabel: 'Eliminar cliente',
        danger: true,
      })
      if (!ok) return
      navigate(paths.clients())
      deleteClient(client.id)
      toastUndo('Cliente eliminado')
    },
    [confirm, deleteClient, toastUndo],
  )

  return { archive, restore, remove }
}
