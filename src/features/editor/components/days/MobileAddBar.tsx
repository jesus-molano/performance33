import { LayoutGrid, Plus } from 'lucide-react'
import { Button } from '@/components/ui'

export interface MobileAddBarProps {
  /** A full day explains itself with a toast when tapped. */
  onAddBlock: () => void
  /** Adds a row to the last block of the day; omitted when the day has no blocks. */
  onAddExercise?: () => void
}

/** Sticky thumb-reach actions on phones. */
export function MobileAddBar({ onAddBlock, onAddExercise }: MobileAddBarProps) {
  return (
    <div className="sticky bottom-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom)+0.75rem)] z-20 mt-2 flex gap-2 rounded-2xl border border-line bg-surface/95 p-2 shadow-pop backdrop-blur md:hidden">
      {onAddExercise && (
        <Button variant="secondary" leftIcon={Plus} onClick={onAddExercise} className="flex-1">
          Ejercicio
        </Button>
      )}
      <Button leftIcon={LayoutGrid} onClick={onAddBlock} className="flex-1">
        Bloque
      </Button>
    </div>
  )
}
