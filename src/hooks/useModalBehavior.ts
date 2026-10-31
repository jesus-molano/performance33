import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = 'input, textarea, select, button:not([data-modal-close]), [href], [tabindex]:not([tabindex="-1"])'

/** Escape to close, body scroll lock, focus the first field on open and restore focus on close. */
export function useModalBehavior(open: boolean, onClose: () => void, panelRef: RefObject<HTMLElement | null>): void {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [open, panelRef])
}
