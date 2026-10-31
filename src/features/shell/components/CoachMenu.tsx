import { Check, UserCog, Users, type LucideIcon } from 'lucide-react'
import { Avatar } from '@/components/ui'
import type { Coach } from '@/types'

export interface CoachMenuProps {
  coaches: Coach[]
  currentId: string | null
  onSwitch: (coach: Coach) => void
  onManage: () => void
  onShowPicker: () => void
}

const ROW = 'flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-md text-fg hover:bg-fg/5'

function MenuLink({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className={ROW}>
      <Icon size={18} aria-hidden className="text-fg-muted" />
      {label}
    </button>
  )
}

/** Dropdown content of the header coach switcher. */
export function CoachMenu({ coaches, currentId, onSwitch, onManage, onShowPicker }: CoachMenuProps) {
  return (
    <div
      role="menu"
      className="absolute top-full right-0 z-40 mt-2 w-72 origin-top-right animate-pop-in rounded-2xl border border-line bg-surface p-1.5 shadow-pop"
    >
      <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-fg-subtle uppercase">¿Quién está usando la app?</p>
      {coaches.map((coach) => (
        <button key={coach.id} type="button" role="menuitemradio" aria-checked={coach.id === currentId} onClick={() => onSwitch(coach)} className={ROW}>
          <Avatar firstName={coach.name} color={coach.color} size="sm" />
          <span className="flex-1 truncate font-medium">{coach.name}</span>
          {coach.id === currentId && <Check size={18} aria-hidden className="text-brand-strong" />}
        </button>
      ))}
      <div role="separator" className="my-1 h-px bg-line" />
      <MenuLink icon={Users} label="Pantalla de perfiles" onClick={onShowPicker} />
      <MenuLink icon={UserCog} label="Gestionar monitores" onClick={onManage} />
    </div>
  )
}
