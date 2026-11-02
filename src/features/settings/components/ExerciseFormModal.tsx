import { useId } from 'react'
import { Button, Callout, Input, Modal, SegmentedControl, Select, Switch } from '@/components/ui'
import { EXERCISE_NAME_MAX_LENGTH } from '@/config/capacity'
import { EXERCISE_TYPE_OPTIONS, MUSCLE_OPTIONS } from '@/config/exerciseTags'
import { getLengthHint } from '@/lib/capacity'
import type { LibraryExercise } from '@/types'
import { MEASURE_OPTIONS } from '@/features/settings/config'
import { useExerciseForm } from '@/features/settings/hooks/useExerciseForm'
import { SecondaryMusclesField } from './SecondaryMusclesField'

export interface ExerciseFormModalProps {
  /** null = new exercise. */
  exercise: LibraryExercise | null
  onClose: () => void
}

export function ExerciseFormModal({ exercise, onClose }: ExerciseFormModalProps) {
  const { isEdit, values, setField, setMainMuscle, toggleSecondaryMuscle, nameError, linkError, similar, submit } = useExerciseForm(exercise, onClose)
  const formId = useId()

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar ejercicio' : 'Nuevo ejercicio'}
      description="Aparecerá al escribir en las rutinas."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            {isEdit ? 'Guardar cambios' : 'Añadir a la biblioteca'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-5 pt-1">
        <div className="flex flex-col gap-2">
          <Input
            label="Nombre"
            placeholder="Ej.: Remo con TRX"
            value={values.name}
            maxLength={EXERCISE_NAME_MAX_LENGTH}
            hint={getLengthHint(values.name, EXERCISE_NAME_MAX_LENGTH)}
            onChange={(e) => setField('name', e.target.value)}
            error={nameError}
            autoFocus
            autoComplete="off"
          />
          {similar.length > 0 && (
            <Callout>
              Ya existe algo parecido: <strong>{similar.map((e) => e.name).join(', ')}</strong>. Comprueba que no sea el mismo.
            </Callout>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Músculo principal" options={MUSCLE_OPTIONS} value={values.muscle} onChange={setMainMuscle} />
          <Select label="Tipo" options={EXERCISE_TYPE_OPTIONS} value={values.type} onChange={(type) => setField('type', type)} />
        </div>
        <SecondaryMusclesField main={values.muscle} selected={values.secondaryMuscles} onToggle={toggleSecondaryMuscle} />
        <Input label="Material" placeholder="Ej.: TRX, Banco" hint="Separa con comas." value={values.equipment} onChange={(e) => setField('equipment', e.target.value)} />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-fg">Se mide por</span>
          <SegmentedControl ariaLabel="Se mide por" options={MEASURE_OPTIONS} value={values.defaultMeasure} onChange={(m) => setField('defaultMeasure', m)} fullWidth />
        </div>
        <Switch checked={values.perSide} onChange={(perSide) => setField('perSide', perSide)} label="Se hace por lado" description="Añade «c/lado» automáticamente." />
        <Input
          label="Otros nombres (opcional)"
          placeholder="Ej.: TRX row, Remo invertido"
          hint="Ayudan a encontrarlo al buscar. Separa con comas."
          value={values.aliases}
          onChange={(e) => setField('aliases', e.target.value)}
        />
        <Input
          label="Enlace (vídeo o explicación)"
          type="url"
          inputMode="url"
          placeholder="Ej.: https://youtu.be/abc"
          hint="Opcional. Sin enlace, el icono del ejercicio lo busca en Google."
          value={values.link}
          error={linkError}
          onChange={(e) => setField('link', e.target.value)}
        />
      </form>
    </Modal>
  )
}
