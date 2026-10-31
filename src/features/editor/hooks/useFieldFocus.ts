import { useEffect, useRef } from 'react'
import { useEditorUi, type RowField } from '@/features/editor/store/editorUiStore'

/** Ref for a row field that focuses (and selects) itself when the editor requests it. */
export function useFieldFocus<T extends HTMLInputElement>(exerciseId: string, field: RowField) {
  const ref = useRef<T>(null)
  const request = useEditorUi((s) => s.focusRequest)
  const clearFocus = useEditorUi((s) => s.clearFocus)

  useEffect(() => {
    if (!request || request.exerciseId !== exerciseId || request.field !== field || !ref.current) return
    ref.current.focus()
    ref.current.select()
    clearFocus()
  }, [request, exerciseId, field, clearFocus])

  return ref
}
