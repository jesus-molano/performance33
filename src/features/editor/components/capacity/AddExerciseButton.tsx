import { Plus } from 'lucide-react'
import { CAPACITY_TEXTS } from '@/config/capacity'
import type { CapacityRefusal } from '@/lib/capacity'

export interface AddExerciseButtonProps {
  onClick: () => void
  /** Why no more exercises fit, or null. */
  refusal: CapacityRefusal | null
}

/** Dashed 'Añadir ejercicio', replaced by the explanation when the block or the day is full. */
export function AddExerciseButton({ onClick, refusal }: AddExerciseButtonProps) {
  if (refusal) {
    return <p className="flex min-h-11 items-center justify-center rounded-xl bg-fg/5 px-3 text-center text-sm text-fg-muted">{CAPACITY_TEXTS.refusals[refusal]}</p>
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-md font-medium text-fg-muted transition-colors hover:border-brand-strong hover:bg-brand-soft hover:text-brand-strong"
    >
      <Plus size={18} aria-hidden />
      Añadir ejercicio
    </button>
  )
}
