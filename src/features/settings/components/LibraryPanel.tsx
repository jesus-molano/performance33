import { Dumbbell, Plus } from 'lucide-react'
import { Button, Card, EmptyState } from '@/components/ui'
import type { AnyLibraryExercise } from '@/types'
import { editedItem, useEditTarget } from '@/features/shell'
import { useLibraryBrowser } from '@/features/settings/hooks/useLibraryBrowser'
import { ExerciseFormModal } from './ExerciseFormModal'
import { LibraryExerciseRow } from './LibraryExerciseRow'
import { LibraryToolbar } from './LibraryToolbar'

/** Ajustes → Ejercicios: browse the library, add/edit/delete your own exercises. */
export function LibraryPanel() {
  const browser = useLibraryBrowser()
  const form = useEditTarget<AnyLibraryExercise>()
  const hidden = browser.matchCount - browser.visible.length

  return (
    <Card padding="none">
      <div className="flex flex-col gap-4 border-b border-line p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fg">Biblioteca de ejercicios</h2>
            <p className="text-sm text-fg-muted">Busca sin preocuparte por tildes: «press», «prés» o «bench» encuentran lo mismo.</p>
          </div>
          <Button leftIcon={Plus} onClick={form.openCreate}>
            Añadir ejercicio
          </Button>
        </div>
        <LibraryToolbar filters={browser.filters} setFilter={browser.setFilter} customCount={browser.customCount} totalCount={browser.totalCount} />
      </div>
      {browser.visible.length > 0 ? (
        <ul className="divide-y divide-line">
          {browser.visible.map((exercise) => (
            <LibraryExerciseRow key={exercise.id} exercise={exercise} onEdit={form.openEdit} onDelete={browser.remove} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Dumbbell}
          title={browser.filters.scope === 'custom' && !browser.filters.query ? 'Aún no has añadido ejercicios propios' : 'No hay ejercicios con esa búsqueda'}
          description="Puedes añadirlos aquí o guardarlos desde el editor de rutinas."
        />
      )}
      {hidden > 0 && <p className="border-t border-line px-5 py-3 text-center text-sm text-fg-muted">Y {hidden} más. Escribe para afinar la búsqueda.</p>}
      {form.target && <ExerciseFormModal exercise={editedItem(form.target)} onClose={form.close} />}
    </Card>
  )
}
