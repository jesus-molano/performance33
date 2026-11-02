import { Button, Callout, Input, Modal, Select } from '@/components/ui'
import { EXERCISE_NAME_MAX_LENGTH } from '@/config/capacity'
import { EXERCISE_TYPE_OPTIONS, MUSCLE_OPTIONS } from '@/config/exerciseTags'
import { getLengthHint } from '@/lib/capacity'
import { formatExerciseMeta } from '@/lib/exerciseLibrary'
import type { SaveToLibraryApi } from '@/features/editor/hooks/useSaveToLibrary'

export interface SaveToLibraryModalProps {
  api: SaveToLibraryApi
  onClose: () => void
}

/** Name + muscle + type + material. Similar library names are offered first to avoid duplicates. */
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
        <Input
          label="Nombre"
          nativeUndo
          value={api.draft.name}
          maxLength={EXERCISE_NAME_MAX_LENGTH}
          hint={getLengthHint(api.draft.name, EXERCISE_NAME_MAX_LENGTH)}
          onChange={(e) => api.setField('name', e.target.value)}
          autoFocus
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Músculo principal" options={MUSCLE_OPTIONS} value={api.draft.muscle} onChange={(muscle) => api.setField('muscle', muscle)} />
          <Select label="Tipo" options={EXERCISE_TYPE_OPTIONS} value={api.draft.type} onChange={(type) => api.setField('type', type)} />
        </div>
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
