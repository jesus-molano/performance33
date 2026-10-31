import { useLayoutEffect, useState, type RefObject } from 'react'

export type MenuPlacement = 'down' | 'up'

/** Item height + padding of the popover (DropdownMenu items are 44 px). */
const ITEM_HEIGHT = 44
const MENU_PADDING = 16

/** Opens a popover upwards when it would not fit below its trigger (last rows of a long page). */
export function useMenuPlacement(triggerRef: RefObject<HTMLElement | null>, isOpen: boolean, itemCount: number): MenuPlacement {
  const [placement, setPlacement] = useState<MenuPlacement>('down')
  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const menuHeight = itemCount * ITEM_HEIGHT + MENU_PADDING
    const fitsBelow = rect.bottom + menuHeight <= window.innerHeight
    setPlacement(fitsBelow || rect.top < menuHeight ? 'down' : 'up')
  }, [isOpen, itemCount, triggerRef])
  return placement
}
