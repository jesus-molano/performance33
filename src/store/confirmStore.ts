import { create } from 'zustand'

export interface ConfirmOptions {
  title: string
  description?: string
  /** Default 'Confirmar'. */
  confirmLabel?: string
  /** Default 'Cancelar'. */
  cancelLabel?: string
  /** Red confirm button for destructive actions. */
  danger?: boolean
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

interface ConfirmState {
  pending: PendingConfirm | null
  /** Opens the dialog; resolves true when confirmed, false when cancelled/closed. */
  request: (options: ConfirmOptions) => Promise<boolean>
  settle: (confirmed: boolean) => void
}

export const useConfirmStore = create<ConfirmState>()((set, get) => ({
  pending: null,
  request: (options) =>
    new Promise<boolean>((resolve) => {
      get().pending?.resolve(false)
      set({ pending: { ...options, resolve } })
    }),
  settle: (confirmed) => {
    get().pending?.resolve(confirmed)
    set({ pending: null })
  },
}))
