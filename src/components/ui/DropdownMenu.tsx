import { MoreHorizontal, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useMenuPlacement } from '@/hooks/useMenuPlacement'
import { cn } from '@/lib/cn'
import { IconButton, type IconButtonSize } from './IconButton'
import { Modal } from './Modal'

export interface MenuAction {
  label: string
  icon?: LucideIcon
  onSelect: () => void
  danger?: boolean
  disabled?: boolean
}

/** 'separator' draws a divider line. */
export type MenuItem = MenuAction | 'separator'

export interface DropdownMenuProps {
  items: MenuItem[]
  /** Trigger label (aria + tooltip, and the sheet title on phones). Default 'Más opciones'. */
  label?: string
  triggerIcon?: LucideIcon
  triggerSize?: IconButtonSize
  align?: 'left' | 'right'
  className?: string
}

function MenuItems({ items, onDone, large }: { items: MenuItem[]; onDone: () => void; large: boolean }) {
  return items.map((item, index) =>
    item === 'separator' ? (
      <div key={`sep-${index}`} role="separator" className="my-1 h-px bg-line" />
    ) : (
      <button
        key={item.label}
        type="button"
        role="menuitem"
        disabled={item.disabled}
        onClick={() => {
          onDone()
          item.onSelect()
        }}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 text-left text-md disabled:opacity-40',
          large ? 'h-12' : 'h-11',
          item.danger ? 'text-red-600 hover:bg-red-50' : 'text-fg hover:bg-fg/5',
        )}
      >
        {item.icon && <item.icon size={17} aria-hidden className={item.danger ? '' : 'text-fg-muted'} />}
        {item.label}
      </button>
    ),
  )
}

/**
 * '⋯' menu: every secondary action lives here (no hover-only controls). On phones the items open
 * in a bottom sheet like every other mobile overlay; on desktop a popover that flips up near the bottom.
 */
export function DropdownMenu({
  items,
  label = 'Más opciones',
  triggerIcon = MoreHorizontal,
  triggerSize = 'md',
  align = 'right',
  className,
}: DropdownMenuProps) {
  const { isOpen, toggle, close } = useDisclosure()
  const isMobile = useIsMobile()
  const rootRef = useRef<HTMLDivElement>(null)
  const refs = useMemo(() => [rootRef], [])
  const placement = useMenuPlacement(rootRef, isOpen && !isMobile, items.length)
  useClickOutside(refs, close, isOpen && !isMobile)

  useEffect(() => {
    if (!isOpen || isMobile) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && close()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, isMobile, close])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <IconButton icon={triggerIcon} label={label} size={triggerSize} onClick={toggle} aria-expanded={isOpen} aria-haspopup="menu" />
      {isOpen && isMobile && (
        <Modal open onClose={close} size="sm" title={label}>
          <div role="menu" className="flex flex-col pb-2">
            <MenuItems items={items} onDone={close} large />
          </div>
        </Modal>
      )}
      {isOpen && !isMobile && (
        <div
          role="menu"
          className={cn(
            'absolute z-40 min-w-56 animate-pop-in rounded-xl border border-line bg-surface p-1 shadow-pop',
            placement === 'down' ? 'top-full mt-1' : 'bottom-full mb-1',
            align === 'right' ? 'right-0' : 'left-0',
            placement === 'down' ? (align === 'right' ? 'origin-top-right' : 'origin-top-left') : align === 'right' ? 'origin-bottom-right' : 'origin-bottom-left',
          )}
        >
          <MenuItems items={items} onDone={close} large={false} />
        </div>
      )}
    </div>
  )
}
