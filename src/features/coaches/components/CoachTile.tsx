import { Pencil, Plus } from 'lucide-react'
import { readableTextOn } from '@/lib/color'
import { cn } from '@/lib/cn'
import { getInitials } from '@/lib/format'
import type { Coach } from '@/types'

const TILE = 'flex size-28 items-center justify-center rounded-3xl transition-all duration-200 sm:size-36'
const WRAPPER = 'group flex flex-col items-center gap-3 rounded-3xl p-1 focus-visible:outline-brand'
const LABEL = 'text-lg font-medium text-ink-muted transition-colors group-hover:text-white'

export interface CoachTileProps {
  coach: Coach
  /** 'Editar perfiles' mode: clicking edits instead of entering. */
  editing: boolean
  onClick: (coach: Coach) => void
}

/** Netflix-style profile tile on the '¿Quién eres?' screen. */
export function CoachTile({ coach, editing, onClick }: CoachTileProps) {
  return (
    <button type="button" onClick={() => onClick(coach)} className={WRAPPER} aria-label={editing ? `Editar a ${coach.name}` : `Entrar como ${coach.name}`}>
      <span
        className={cn(TILE, 'relative text-5xl font-semibold ring-brand ring-offset-4 ring-offset-ink group-hover:ring-4 sm:text-6xl')}
        style={{ backgroundColor: coach.color, color: readableTextOn(coach.color) }}
      >
        {getInitials(coach.name).charAt(0)}
        {editing && (
          <span className="absolute inset-0 flex animate-fade-in items-center justify-center rounded-3xl bg-ink/55 text-white">
            <Pencil size={32} aria-hidden />
          </span>
        )}
      </span>
      <span className={LABEL}>{coach.name}</span>
    </button>
  )
}

export function AddCoachTile({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={WRAPPER}>
      <span className={cn(TILE, 'border-2 border-dashed border-ink-line text-ink-muted group-hover:border-brand group-hover:text-brand')}>
        <Plus size={44} aria-hidden />
      </span>
      <span className={LABEL}>Añadir monitor</span>
    </button>
  )
}
