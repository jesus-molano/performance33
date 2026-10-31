import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useClickOutside, useDisclosure } from '@/hooks'

export interface Popover {
  isOpen: boolean
  toggle: () => void
  close: () => void
  rootRef: RefObject<HTMLDivElement | null>
}

/** Open state for a custom popover: closes on outside click and on Escape. */
export function usePopover(): Popover {
  const { isOpen, toggle, close } = useDisclosure()
  const rootRef = useRef<HTMLDivElement>(null)
  const refs = useMemo(() => [rootRef], [])
  useClickOutside(refs, close, isOpen)

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && close()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close])

  return { isOpen, toggle, close, rootRef }
}
