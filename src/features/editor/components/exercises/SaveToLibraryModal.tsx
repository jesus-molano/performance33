import { useState } from 'react'
import { Button, Input, Modal, Select } from '../../../../components/ui'
import { EXERCISE_CATEGORIES } from '../../../../data/exercises'
import type { ExerciseCategory, ExerciseEntry } from '../../../../types'
import type { LibraryDraft, SaveToLibraryApi } from '../../hooks/useSaveToLibrary'
import { libraryMeta } from '../../utils'

const CATEGORY_OPTIONS = EXERCISE_CATEGORIES.map((category) => ({ value: category, label: category }))

export interface SaveToLibraryModalProps {
  entry: ExerciseEntry
  api: SaveToLibraryApi
  onClose: () => void
}

/** Name + category + material. Similar library names are offered first to avoid duplicates. */
export function SaveToLibraryModal({ entry, api, onClose }: SaveToLibraryModalProps) {
  const [draft, setDraft] = useState<LibraryDraft>({ name: entry.name.trim(), category: EXERCISE_CATEGORIES[0], equipment: '' })
  const valid = draft.name.trim().length > 1
  const submit = () => {
    if (!valid) return
    api.save(draft)
    onClose()
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
          <Button onClick={submit} disabled={!valid}>
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
          <div className="flex flex-col gap-2 rounded-xl bg-sky-50 p-3 text-sky-900">
            <p className="text-sm font-medium">¿Es alguno de estos? Ya están en la biblioteca:</p>
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
                <span className="text-xs text-fg-muted">{libraryMeta(exercise)}</span>
              </button>
            ))}
          </div>
        )}
        <Input label="Nombre" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
        <Select<ExerciseCategory>
          label="Categoría"
          options={CATEGORY_OPTIONS}
          value={draft.category}
          onChange={(category) => setDraft({ ...draft, category })}
        />
        <Input
          label="Material (opcional)"
          hint="Separado por comas: Kettlebell, Banco"
          value={draft.equipment}
          onChange={(e) => setDraft({ ...draft, equipment: e.target.value })}
        />
      </form>
    </Modal>
  )
}
