import { Pencil, Trash2 } from 'lucide-react'
import { ExerciseLink } from '@/components/exercises/ExerciseLink'
import { Badge, DropdownMenu, type MenuItem } from '@/components/ui'
import { MEASURE_META } from '@/config/exerciseFields'
import type { LibraryExercise } from '@/types'
import { formatExerciseMeta } from '@/lib/exerciseLibrary'

export interface LibraryExerciseRowProps {
  exercise: LibraryExercise
  onEdit: (exercise: LibraryExercise) => void
  onDelete: (exercise: LibraryExercise) => void
}

/** Library entry: every exercise can be edited or deleted. */
export function LibraryExerciseRow({ exercise, onEdit, onDelete }: LibraryExerciseRowProps) {
  const menu: MenuItem[] = [
    { label: 'Editar', icon: Pencil, onSelect: () => onEdit(exercise) },
    { label: 'Eliminar', icon: Trash2, danger: true, onSelect: () => onDelete(exercise) },
  ]
  return (
    <div className="flex min-h-16 items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-md font-medium text-fg">{exercise.name}</p>
        <p className="truncate text-sm text-fg-muted">{formatExerciseMeta(exercise)}</p>
      </div>
      <Badge size="sm" className="hidden sm:inline-flex">
        {MEASURE_META[exercise.defaultMeasure].label}
      </Badge>
      <ExerciseLink name={exercise.name} link={exercise.link} />
      <DropdownMenu items={menu} label={`Opciones de ${exercise.name}`} />
    </div>
  )
}
