import { useCallback, useState } from 'react'

export type EditTarget<T> = { mode: 'create' } | { mode: 'edit'; item: T }

export interface EditTargetApi<T> {
  /** null = form closed. Render the form only while open so it always starts fresh. */
  target: EditTarget<T> | null
  openCreate: () => void
  openEdit: (item: T) => void
  close: () => void
}

/** Open/close state for a create-or-edit modal form. */
export function useEditTarget<T>(): EditTargetApi<T> {
  const [target, setTarget] = useState<EditTarget<T> | null>(null)
  const openCreate = useCallback(() => setTarget({ mode: 'create' }), [])
  const openEdit = useCallback((item: T) => setTarget({ mode: 'edit', item }), [])
  const close = useCallback(() => setTarget(null), [])
  return { target, openCreate, openEdit, close }
}

/** The item being edited, or null when creating. */
export function editedItem<T>(target: EditTarget<T>): T | null {
  return target.mode === 'edit' ? target.item : null
}
