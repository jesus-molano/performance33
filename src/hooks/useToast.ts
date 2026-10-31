import { useCallback } from 'react'
import { COPY } from '@/config/copy'
import { currentDataVersion, isLatestData, onDataChange, undo } from '@/store/history'
import { useToastStore, type ToastInput } from '@/store/toastStore'

export interface ToastApi {
  /** Shows a toast; returns its id. */
  toast: (input: ToastInput) => string
  /**
   * 'Ejercicio eliminado · Deshacer'. Call right after the change it announces: the button undoes
   * exactly that change, and the toast goes away as soon as anything else changes the data.
   */
  toastUndo: (message: string) => string
  dismiss: (id: string) => void
}

export function useToast(): ToastApi {
  const show = useToastStore((s) => s.show)
  const dismiss = useToastStore((s) => s.dismiss)

  const toastUndo = useCallback(
    (message: string) => {
      const version = currentDataVersion()
      const id = show({
        message,
        actionLabel: COPY.undo,
        onAction: () => {
          if (isLatestData(version)) undo()
        },
      })
      const stop = onDataChange(() => {
        stop()
        dismiss(id)
      })
      const stopWhenGone = useToastStore.subscribe((state) => {
        if (state.toasts.some((t) => t.id === id)) return
        stop()
        stopWhenGone()
      })
      return id
    },
    [show, dismiss],
  )

  return { toast: show, toastUndo, dismiss }
}
