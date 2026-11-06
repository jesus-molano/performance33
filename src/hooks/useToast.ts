import { useCallback } from 'react'
import { UNDO_ACTION_TOAST_MS } from '@/config/app'
import { COPY } from '@/config/copy'
import { undo, watchLatestUndoStep } from '@/store/history'
import type { UndoStepWatch } from '@/store/history'
import { useToastStore, type ToastInput, type ToastTone } from '@/store/toastStore'

export interface ToastApi {
  /** Shows a toast; returns its id. */
  toast: (input: ToastInput) => string
  /**
   * 'Ejercicio eliminado · Deshacer'. Call right after the change it announces: the button undoes
   * exactly that change. It goes away when this person changes something else; a change from another
   * coach leaves it in place unless that change cancels the step.
   */
  toastUndo: (message: string) => string
  /**
   * 'Marta → Pantalla 2 · Deshacer' for a change outside the routine history: 'Deshacer' (or Ctrl+Z while it is up)
   * runs `onUndo`. It stays UNDO_ACTION_TOAST_MS and goes away when this person edits a routine, so Ctrl+Z is theirs again.
   */
  toastUndoAction: (input: { message: string; tone?: ToastTone; onUndo: () => void }) => string
  dismiss: (id: string) => void
}

export function useToast(): ToastApi {
  const show = useToastStore((s) => s.show)
  const dismiss = useToastStore((s) => s.dismiss)

  const toastUndo = useCallback(
    (message: string) => {
      let watch: UndoStepWatch | null = null
      const id = show({
        message,
        actionLabel: COPY.undo,
        onAction: () => {
          if (watch?.isCurrent()) undo()
        },
      })
      watch = watchLatestUndoStep(() => {
        watch?.stop()
        dismiss(id)
      })
      const stopWhenGone = useToastStore.subscribe((state) => {
        if (state.toasts.some((t) => t.id === id)) return
        watch?.stop()
        stopWhenGone()
      })
      return id
    },
    [show, dismiss],
  )

  const toastUndoAction = useCallback(
    ({ message, tone, onUndo }: { message: string; tone?: ToastTone; onUndo: () => void }) => {
      const id = show({ message, tone, actionLabel: COPY.undo, onAction: onUndo, durationMs: UNDO_ACTION_TOAST_MS, undoShortcut: true })
      const watch = watchLatestUndoStep(() => dismiss(id))
      const stopWhenGone = useToastStore.subscribe((state) => {
        if (state.toasts.some((t) => t.id === id)) return
        watch.stop()
        stopWhenGone()
      })
      return id
    },
    [show, dismiss],
  )

  return { toast: show, toastUndo, toastUndoAction, dismiss }
}
