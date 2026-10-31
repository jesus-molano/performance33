import { useCallback } from 'react'
import { undo } from '../store/history'
import { useToastStore, type ToastInput } from '../store/toastStore'

export interface ToastApi {
  /** Shows a toast; returns its id. */
  toast: (input: ToastInput) => string
  /** 'Ejercicio eliminado · Deshacer': toast whose action undoes the last change. */
  toastUndo: (message: string) => string
  dismiss: (id: string) => void
}

export function useToast(): ToastApi {
  const show = useToastStore((s) => s.show)
  const dismiss = useToastStore((s) => s.dismiss)
  const toastUndo = useCallback(
    (message: string) => show({ message, actionLabel: 'Deshacer', onAction: undo }),
    [show],
  )
  return { toast: show, toastUndo, dismiss }
}
