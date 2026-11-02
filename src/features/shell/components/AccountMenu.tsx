import { ChevronDown, LogOut, UserRound, type LucideIcon } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { ProfileModal } from '@/features/team'
import { useAccountMenu } from '@/features/shell/hooks/useAccountMenu'
import { usePopover } from '@/features/shell/hooks/usePopover'

function MenuRow({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-md text-fg hover:bg-fg/5">
      <Icon size={18} aria-hidden className="text-fg-muted" />
      {label}
    </button>
  )
}

/** Header button with the signed-in coach; opens 'Mi perfil' and 'Cerrar sesión'. */
export function AccountMenu() {
  const account = useAccountMenu()
  const { isOpen, toggle, close, rootRef } = usePopover()
  const run = (action: () => void) => () => {
    close()
    action()
  }

  if (!account.staff) return null
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Sesión de ${account.staff.name}. Abrir menú`}
        className="flex h-11 items-center gap-2 rounded-xl pr-2 pl-1 hover:bg-fg/5 sm:pr-3"
      >
        <Avatar firstName={account.staff.name} color={account.staff.color} size="sm" />
        <span className="hidden text-sm font-semibold text-fg sm:inline">{account.staff.name}</span>
        <ChevronDown size={16} aria-hidden className="text-fg-subtle" />
      </button>
      {isOpen && (
        <div role="menu" className="absolute top-full right-0 z-40 mt-2 w-64 origin-top-right animate-pop-in rounded-2xl border border-line bg-surface p-1.5 shadow-pop">
          <p className="truncate px-3 pt-2 pb-1 text-sm text-fg-subtle">{account.staff.email}</p>
          <MenuRow icon={UserRound} label="Mi perfil" onClick={run(account.openProfile)} />
          <MenuRow icon={LogOut} label="Cerrar sesión" onClick={run(() => void account.signOut())} />
        </div>
      )}
      {account.profileOpen && <ProfileModal staff={account.staff} onClose={account.closeProfile} />}
    </div>
  )
}
