import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react'
import { useIsMobile } from '@/hooks'
import { useEditorUi } from '@/features/editor/store/editorUiStore'

export interface RowExpansion {
  /** Expanded inline (desktop). On phones the open row is edited in the bottom sheet instead. */
  expanded: boolean
  toggle: () => void
  close: () => void
  /** Escape anywhere inside the inline editor closes the row. */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  /** Summary button: gets focus back when the row closes, so keyboard users can continue. */
  toggleRef: RefObject<HTMLButtonElement | null>
}

export function useRowExpansion(entryId: string): RowExpansion {
  const isMobile = useIsMobile()
  const isOpen = useEditorUi((s) => s.expandedExerciseId === entryId)
  const openRow = useEditorUi((s) => s.openRow)
  const closeRow = useEditorUi((s) => s.closeRow)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const expanded = isOpen && !isMobile
  const wasExpanded = useRef(expanded)

  useEffect(() => {
    const focusLost = !document.activeElement || document.activeElement === document.body
    if (wasExpanded.current && !expanded && focusLost) toggleRef.current?.focus()
    wasExpanded.current = expanded
  }, [expanded])

  return {
    expanded,
    toggle: () => (expanded ? closeRow() : openRow(entryId)),
    close: closeRow,
    onKeyDown: (event) => {
      // React bubbles through portals: Escape inside a modal opened from this row only closes that modal.
      if (event.key === 'Escape' && !event.defaultPrevented && event.currentTarget.contains(event.target as Node)) closeRow()
    },
    toggleRef,
  }
}
