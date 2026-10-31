import { create } from 'zustand'
import { TOAST_DURATION_MS } from '../config/app'
import { newId } from '../lib/ids'

export type ToastTone = 'neutral' | 'success' | 'error'

export interface ToastInput {
  message: string
  tone?: ToastTone
  /** Optional action button, e.g. 'Deshacer'. Runs inside the click handler. */
  actionLabel?: string
  onAction?: () => void
  /** Default TOAST_DURATION_MS. */
  durationMs?: number
}

export interface Toast extends Required<Pick<ToastInput, 'message' | 'tone' | 'durationMs'>> {
  id: string
  actionLabel?: string
  onAction?: () => void
}

interface ToastState {
  toasts: Toast[]
  show: (input: ToastInput) => string
  dismiss: (id: string) => void
}

/** Max toasts visible at once (oldest are dropped). */
const MAX_TOASTS = 3

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  show: (input) => {
    const toast: Toast = {
      id: newId('toast'),
      message: input.message,
      tone: input.tone ?? 'neutral',
      durationMs: input.durationMs ?? TOAST_DURATION_MS,
      actionLabel: input.actionLabel,
      onAction: input.onAction,
    }
    set((s) => ({ toasts: [...s.toasts, toast].slice(-MAX_TOASTS) }))
    return toast.id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
