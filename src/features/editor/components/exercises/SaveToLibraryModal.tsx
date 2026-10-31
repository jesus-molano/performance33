import { Button, Callout, Input, Modal, Select } from '@/components/ui'
import { EXERCISE_CATEGORY_OPTIONS } from '@/config/exerciseCategories'
import { formatExerciseMeta } from '@/lib/exerciseLibrary'
import type { ExerciseCategory } from '@/types'
import type { SaveToLibraryApi } from '@/features/editor/hooks/useSaveToLibrary'

export interface SaveToLibraryModalProps {
  api: SaveToLibraryApi
  onClose: () => void
}

/** Name + category + material. Similar library names are offered first to avoid duplicates. */
export function SaveToLibraryModal({ api, onClose }: SaveToLibraryModalProps) {
  const submit = () => {
    if (api.submit()) onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Guardar en la biblioteca"
      description="Aparecerá en la búsqueda para todos los monitores."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!api.valid}>
            Guardar ejercicio
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        {api.similar.length > 0 && (
          <Callout>
            <p className="mb-2 font-medium">¿Es alguno de estos? Ya están en la biblioteca:</p>
            <div className="flex flex-col gap-2">
              {api.similar.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    api.pickExisting(exercise)
                    onClose()
                  }}
                  className="flex min-h-11 flex-col items-start justify-center rounded-lg bg-surface px-3 py-1.5 text-left shadow-card hover:bg-sky-100"
                >
                  <span className="font-medium text-fg">Usar «{exercise.name}»</span>
                  <span className="text-xs text-fg-muted">{formatExerciseMeta(exercise)}</span>
                </button>
              ))}
            </div>
          </Callout>
        )}
        <Input label="Nombre" nativeUndo value={api.draft.name} onChange={(e) => api.setField('name', e.target.value)} autoFocus />
        <Select<ExerciseCategory>
          label="Categoría"
          options={EXERCISE_CATEGORY_OPTIONS}
          value={api.draft.category}
          onChange={(category) => api.setField('category', category)}
        />
        <Input
          label="Material (opcional)"
          hint="Separado por comas: Kettlebell, Banco"
          nativeUndo
          value={api.draft.equipment}
          onChange={(e) => api.setField('equipment', e.target.value)}
        />
      </form>
    </Modal>
  )
}
