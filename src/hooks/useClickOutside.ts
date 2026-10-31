import { useEffect, useRef, type RefObject } from 'react'

/** Calls `onOutside` on pointerdown outside every given element (menus, autocomplete lists). */
export function useClickOutside(
  refs: Array<RefObject<HTMLElement | null>>,
  onOutside: () => void,
  enabled = true,
): void {
  const handler = useRef(onOutside)
  useEffect(() => {
    handler.current = onOutside
  })
  useEffect(() => {
    if (!enabled) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (refs.every((ref) => !ref.current?.contains(target))) handler.current()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [refs, enabled])
}
