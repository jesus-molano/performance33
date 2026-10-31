import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn'

const ITEM_CLASSES = 'flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors'

function itemTone(active: boolean): string {
  return active ? 'bg-white/10 text-white' : 'text-ink-muted hover:bg-white/5 hover:text-white'
}

function ItemContent({ icon: Icon, active, children }: { icon: LucideIcon; active: boolean; children: ReactNode }) {
  return (
    <>
      <Icon size={19} aria-hidden className={active ? 'text-brand' : undefined} />
      <span className="flex-1 text-left">{children}</span>
      {active && <span aria-hidden className="h-5 w-1 rounded-full bg-brand" />}
    </>
  )
}

export interface SidebarLinkProps {
  href: string
  icon: LucideIcon
  label: string
  active: boolean
}

export function SidebarLink({ href, icon, label, active }: SidebarLinkProps) {
  return (
    <a href={href} aria-current={active ? 'page' : undefined} className={cn(ITEM_CLASSES, itemTone(active))}>
      <ItemContent icon={icon} active={active}>
        {label}
      </ItemContent>
    </a>
  )
}

export interface SidebarActionProps {
  icon: LucideIcon
  label: string
  hint?: string
  onClick: () => void
}

/** Sidebar entry that runs an action (e.g. opening the TV window) instead of navigating. */
export function SidebarAction({ icon, label, hint, onClick }: SidebarActionProps) {
  return (
    <button type="button" onClick={onClick} title={hint} className={cn(ITEM_CLASSES, itemTone(false))}>
      <ItemContent icon={icon} active={false}>
        {label}
      </ItemContent>
    </button>
  )
}
