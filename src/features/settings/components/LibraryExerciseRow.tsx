import { Pencil, Trash2 } from 'lucide-react'
import { Badge, DropdownMenu, type MenuItem } from '../../../components/ui'
import { MEASURE_META } from '../../../config/exerciseFields'
import type { AnyLibraryExercise } from '../../../types'
import { formatExerciseMeta } from '../utils/exerciseForm'

export interface LibraryExerciseRowProps {
  exercise: AnyLibraryExercise
  onEdit: (exercise: AnyLibraryExercise) => void
  onDelete: (exercise: AnyLibraryExercise) => void
}

/** Library entry. Only custom exercises can be edited or deleted. */
export function LibraryExerciseRow({ exercise, onEdit, onDelete }: LibraryExerciseRowProps) {
  const menu: MenuItem[] = [
    { label: 'Editar', icon: Pencil, onSelect: () => onEdit(exercise) },
    { label: 'Eliminar', icon: Trash2, danger: true, onSelect: () => onDelete(exercise) },
  ]
  return (
    <li className="flex min-h-16 items-center gap-3 px-4 py-2.5 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-fg">{exercise.name}</p>
        <p className="truncate text-sm text-fg-muted">{formatExerciseMeta(exercise)}</p>
      </div>
      <Badge size="sm" className="hidden sm:inline-flex">
        {MEASURE_META[exercise.defaultMeasure].label}
      </Badge>
      {exercise.custom ? (
        <>
          <Badge tone="brand" size="sm">
            Propio
          </Badge>
          <DropdownMenu items={menu} label={`Opciones de ${exercise.name}`} />
        </>
      ) : (
        <span className="w-11 text-center text-xs text-fg-subtle">Incluido</span>
      )}
    </li>
  )
}
