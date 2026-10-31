import { useCallback } from 'react'
import { useToast } from '../../../hooks/useToast'
import { breakUndoGroup, useAppActions, useBranding } from '../../../store'
import type { Branding } from '../../../types'

export interface BrandingEditorApi {
  branding: Branding
  /** Autosaves immediately (typing groups into one undo step). */
  update: (patch: Partial<Branding>) => void
  /** Call on blur so the next edit starts a new undo step. */
  endEdit: () => void
  reset: () => void
}

export function useBrandingEditor(): BrandingEditorApi {
  const branding = useBranding()
  const { updateBranding, resetBranding } = useAppActions()
  const { toastUndo } = useToast()

  const reset = useCallback(() => {
    resetBranding()
    toastUndo('Marca restablecida')
  }, [resetBranding, toastUndo])

  return { branding, update: updateBranding, endEdit: breakUndoGroup, reset }
}
