import { useConfirmStore, type ConfirmOptions } from '../store/confirmStore'

/**
 * Promise-based confirm dialog (rendered once by <ConfirmHost/>). Use ONLY for big destructive
 * actions (delete program/client, reset data); row deletes use an undo toast instead.
 *   const confirm = useConfirm()
 *   if (await confirm({ title: '¿Eliminar rutina?', danger: true })) deleteProgram(id)
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  return useConfirmStore((s) => s.request)
}
