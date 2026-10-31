import { MoreHorizontal, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import { useDisclosure } from '../../hooks/useDisclosure'
import { cn } from '../../lib/cn'
import { IconButton, type IconButtonSize } from './IconButton'

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
  /** Trigger label (aria + tooltip). Default 'Más opciones'. */
  label?: string
  triggerIcon?: LucideIcon
  triggerSize?: IconButtonSize
  align?: 'left' | 'right'
  className?: string
}

/** '⋯' menu: every secondary action lives here (no hover-only controls). 44 px items. */
export function DropdownMenu({
  items,
  label = 'Más opciones',
  triggerIcon = MoreHorizontal,
  triggerSize = 'md',
  align = 'right',
  className,
}: DropdownMenuProps) {
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

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <IconButton icon={triggerIcon} label={label} size={triggerSize} onClick={toggle} aria-expanded={isOpen} aria-haspopup="menu" />
      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-40 mt-1 min-w-56 animate-pop-in rounded-xl border border-line bg-surface p-1 shadow-pop',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
          )}
        >
          {items.map((item, index) =>
            item === 'separator' ? (
              <div key={`sep-${index}`} role="separator" className="my-1 h-px bg-line" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  close()
                  item.onSelect()
                }}
                className={cn(
                  'flex h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[15px] disabled:opacity-40',
                  item.danger ? 'text-red-600 hover:bg-red-50' : 'text-fg hover:bg-fg/5',
                )}
              >
                {item.icon && <item.icon size={17} aria-hidden className={item.danger ? '' : 'text-fg-muted'} />}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
