import { SearchX } from 'lucide-react'
import { ExerciseFilterFields } from '@/components/exercises/ExerciseFilterFields'
import { ExerciseSearchLink } from '@/components/exercises/ExerciseSearchLink'
import { Badge, EmptyState, Modal, PaginatedList } from '@/components/ui'
import { useExerciseBrowser, useIsMobile } from '@/hooks'
import { formatExerciseMeta } from '@/lib/exerciseLibrary'
import type { AnyLibraryExercise } from '@/types'

export interface ExercisePickerModalProps {
  onPick: (exercise: AnyLibraryExercise) => void
  onClose: () => void
}

/** 'Ver todos los ejercicios': the whole library, page by page. Phones don't get the keyboard until they tap the search. */
export function ExercisePickerModal({ onPick, onClose }: ExercisePickerModalProps) {
  const { filters, setFilter, pagination } = useExerciseBrowser()
  const isMobile = useIsMobile()

  return (
    <Modal open onClose={onClose} size="lg" title="Todos los ejercicios" description="Elige uno para esta fila." focusFirstField={!isMobile}>
      <div className="flex flex-col gap-3">
        <ExerciseFilterFields filters={filters} setFilter={setFilter} />
        {pagination.total > 0 ? (
          <PaginatedList
            pagination={pagination}
            label="Ejercicios de la biblioteca"
            className="-mx-5 md:-mx-6"
            listClassName="flex flex-col px-2 pb-2 md:px-3"
            getKey={(exercise) => exercise.id}
            renderItem={(exercise) => (
              <div className="flex items-center gap-1 rounded-lg hover:bg-fg/5">
                <button type="button" onClick={() => onPick(exercise)} className="flex min-h-12 min-w-0 flex-1 flex-col justify-center rounded-lg px-3 py-1.5 text-left">
                  <span className="flex items-center gap-2 text-md font-medium text-fg">
                    <span className="truncate">{exercise.name}</span>
                    {exercise.custom && <Badge size="sm">Propio</Badge>}
                  </span>
                  <span className="truncate text-xs text-fg-muted">{formatExerciseMeta(exercise)}</span>
                </button>
                <ExerciseSearchLink name={exercise.name} />
              </div>
            )}
          />
        ) : (
          <EmptyState icon={SearchX} title="No hay ejercicios con esa búsqueda" description="Prueba con otra palabra o quita la categoría." />
        )}
      </div>
    </Modal>
  )
}
