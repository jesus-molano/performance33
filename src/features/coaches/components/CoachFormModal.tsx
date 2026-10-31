import { Trash2 } from 'lucide-react'
import { useId } from 'react'
import { ColorSwatchPicker } from '../../../components/ColorSwatchPicker'
import { Avatar, Button, Input, Modal } from '../../../components/ui'
import type { Coach } from '../../../types'
import { useCoachForm } from '../hooks/useCoachForm'
import { COACH_NAME_MAX_LENGTH } from '../utils/coachForm'

export interface CoachFormModalProps {
  /** null = new coach. */
  coach: Coach | null
  onClose: () => void
}

/** Add / edit a coach profile (name + colour). Render it only while open. */
export function CoachFormModal({ coach, onClose }: CoachFormModalProps) {
  const form = useCoachForm(coach, onClose)
  const formId = useId()

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={form.isEdit ? 'Editar perfil' : 'Nuevo monitor'}
      description={form.isEdit ? undefined : 'Cada monitor firma sus notas con su nombre.'}
      footer={
        <>
          {form.canDelete && (
            <Button variant="ghost" leftIcon={Trash2} onClick={form.remove} className="text-red-600 hover:bg-red-50 hover:text-red-700 sm:mr-auto">
              Eliminar
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            {form.isEdit ? 'Guardar cambios' : 'Añadir monitor'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={form.submit} className="flex flex-col gap-5" noValidate>
        <div className="flex justify-center pt-1">
          <Avatar firstName={form.name || '?'} color={form.color} size="xl" />
        </div>
        <Input
          label="Nombre"
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
          maxLength={COACH_NAME_MAX_LENGTH}
          placeholder="Ej.: Carla"
          error={form.error}
          autoFocus
          autoComplete="off"
        />
        <ColorSwatchPicker label="Color" value={form.color} onChange={form.setColor} />
      </form>
    </Modal>
  )
}
