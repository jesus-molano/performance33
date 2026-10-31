import { Redo2, Undo2 } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { useUndoRedo } from '@/hooks'
import { modifierKeyLabel } from '@/features/shell/utils/nav'

/** Header undo/redo (the keyboard shortcuts are wired globally by the dashboard root). */
export function UndoRedoButtons() {
  const { canUndo, canRedo, undo, redo } = useUndoRedo()
  const mod = modifierKeyLabel()
  return (
    <div className="flex items-center" role="group" aria-label="Historial de cambios">
      <IconButton icon={Undo2} label={`Deshacer (${mod}+Z)`} disabled={!canUndo} onClick={undo} />
      <IconButton icon={Redo2} label={`Rehacer (${mod}+Mayús+Z)`} disabled={!canRedo} onClick={redo} />
    </div>
  )
}
